const fs = require('fs');
const path = require('path');

const audioDirectory = path.join(__dirname, '..', 'public', 'generated-audios');

// Ensure the audio directory exists
if (!fs.existsSync(audioDirectory)) {
    fs.mkdirSync(audioDirectory, { recursive: true });
}

function saveAudioFile(filename, data, callback) {
    const buffer = Buffer.from(data, 'base64');
    fs.writeFile(`${audioDirectory}/${filename}`, buffer, (err) => {
        if (err) {
            console.error('Error saving audio file:', err);
            return callback(err);
        }
        callback(null);
    });
}

function getGeneratedAudios(callback) {
    fs.readdir(audioDirectory, (err, files) => {
        if (err) {
            if (typeof callback === 'function') {
                return callback(err, null);
            }
            console.error('Callback is not a function:', callback);
            return;
        }
        const audioFiles = files.filter(file => file.endsWith('.mp3'));
        if (typeof callback === 'function') {
            callback(null, audioFiles);
        } else {
            console.error('Callback is not a function:', callback);
        }
    });
}



function renameAudioFile(oldName, newName, callback) {
    const oldPath = path.join(audioDirectory, oldName);
    const newPath = path.join(audioDirectory, newName);

    if (oldName === newName) {
        return callback(new Error('New name must be different'), 400, 'New name must be different from old name');
    }

    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) return callback(new Error('File not found'), 404, 'File not found');

        fs.access(newPath, fs.constants.F_OK, (err) => {
            if (!err) return callback(new Error('File already exists'), 409, 'A file with that name already exists');

            fs.rename(oldPath, newPath, (err) => {
                if (err) return callback(err, 500, 'Error renaming audio');
                callback(null, 200, 'Audio renamed successfully');
            });
        });
    });
}

function deleteAudios(filenames, callback) {
    const deletePromises = filenames.map((filename) => {
        const filePath = path.join(audioDirectory, filename);
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting audio file ${filename}:`, err);
                    return reject(`Error deleting audio file ${filename}`);
                }
                resolve();
            });
        });
    });

    Promise.all(deletePromises)
        .then(() => callback(null))
        .catch((err) => callback(err));
}

function streamAudioFile(filename, req, res) {
    const filePath = path.join(audioDirectory, filename);
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error fetching audio file:', err);
            return res.status(404).send('Audio file not found');
        }

        const range = req.headers.range;
        if (!range) {
            res.setHeader('Content-Type', 'audio/mpeg');
            return fs.createReadStream(filePath).pipe(res);
        }

        const positions = range.replace(/bytes=/, "").split("-");
        const start = parseInt(positions[0], 10);
        const end = positions[1] ? parseInt(positions[1], 10) : stats.size - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'audio/mpeg',
        });

        fs.createReadStream(filePath, { start, end }).pipe(res);
    });
}

function downloadAudioFile(filename, res) {
    const filePath = path.join(audioDirectory, filename);
    fs.stat(filePath, (err) => {
        if (err) {
            console.error('Error fetching audio file for download:', err);
            return res.status(404).send('Audio file not found');
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading audio file:', err);
                return res.status(500).send('Error downloading audio');
            }
            console.log(`File downloaded: ${filename}`);
        });
    });
}

module.exports = {
    saveAudioFile,
    getGeneratedAudios,
    renameAudioFile,
    deleteAudios,
    streamAudioFile,
    downloadAudioFile,
};

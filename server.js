const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const sanitizeFilename = require('sanitize-filename'); // Added for filename sanitization

const app = express();
const port = 3001;
const audioDirectory = path.join(__dirname, 'public', 'generated-audios'); // Ensure this path exists

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increase payload limit
app.use('/audio', express.static(audioDirectory)); // Serve audio files

// Ensure the audio directory exists
if (!fs.existsSync(audioDirectory)) {
    fs.mkdirSync(audioDirectory, { recursive: true });
}

// Endpoint to save audio files
app.post('/api/save-audio', (req, res) => {
    const { filename, data } = req.body;
    const sanitizedFilename = sanitizeFilename(filename);

    // Convert base64 string back to binary
    const buffer = Buffer.from(data, 'base64');

    fs.writeFile(`${audioDirectory}/${sanitizedFilename}`, buffer, (err) => {
        if (err) {
            console.error('Error saving audio file:', err);
            return res.status(500).send('Error saving audio');
        }
        res.status(201).send('Audio saved successfully');
    });
});

// Endpoint to get list of generated audios
app.get('/api/generated-audios', (req, res) => {
    fs.readdir(audioDirectory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Internal Server Error');
        }
        const audioFiles = files.filter(file => file.endsWith('.mp3'));
        res.json(audioFiles);
    });
});

// Endpoint to rename audio files
app.post('/api/rename-audio', (req, res) => {
    const { oldName, newName } = req.body;
    const sanitizedOldName = sanitizeFilename(oldName);
    const sanitizedNewName = sanitizeFilename(newName);

    if (!sanitizedOldName || !sanitizedNewName) {
        return res.status(400).send('Both oldName and newName are required');
    }

    const oldPath = path.join(audioDirectory, sanitizedOldName);
    const newPath = path.join(audioDirectory, sanitizedNewName);

    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        if (sanitizedOldName === sanitizedNewName) {
            return res.status(400).send('New name must be different from old name');
        }

        fs.access(newPath, fs.constants.F_OK, (err) => {
            if (!err) {
                return res.status(409).send('A file with that name already exists');
            }

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return res.status(500).send('Error renaming audio');
                }
                res.status(200).send('Audio renamed successfully');
            });
        });
    });
});

// Endpoint to merge selected audio files
app.post('/api/merge-audios', (req, res) => {
    const { filenames, outputName } = req.body;

    if (!filenames || filenames.length === 0) {
        return res.status(400).send('No audio files provided for merging');
    }

    const listFilePath = path.join(__dirname, 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, sanitizeFilename(filename))}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) {
            return res.status(500).send('Error preparing files for merging');
        }

        const outputPath = path.join(audioDirectory, sanitizeFilename(outputName));
        exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputPath}`, (error) => {
            fs.unlink(listFilePath, () => {}); // Delete the temporary list file
            if (error) {
                return res.status(500).send('Error merging audios');
            }
            res.status(200).send('Audios merged successfully');
        });
    });
});

// Endpoint to play audio files
app.get('/api/play-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(audioDirectory, filename);

    fs.stat(filePath, (err, stats) => {
        if (err) {
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
});

// Endpoint to download audio files
app.get('/api/download-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(audioDirectory, filename);

    res.download(filePath, (err) => {
        if (err) {
            return res.status(500).send('Error downloading audio');
        }
    });
});

// Endpoint to delete multiple audio files
app.post('/api/delete-audios', (req, res) => {
    const { filenames } = req.body;

    if (!filenames || filenames.length === 0) {
        return res.status(400).send('No audio files provided for deletion');
    }

    const deletePromises = filenames.map((filename) => {
        const sanitizedFilename = sanitizeFilename(filename);
        const filePath = path.join(audioDirectory, sanitizedFilename);
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    return reject(`Error deleting audio file ${sanitizedFilename}`);
                }
                resolve();
            });
        });
    });

    Promise.all(deletePromises)
        .then(() => res.status(204).send())
        .catch((error) => res.status(500).send(error));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

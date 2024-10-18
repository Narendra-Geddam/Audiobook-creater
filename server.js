const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

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

    // Convert base64 string back to binary
    const buffer = Buffer.from(data, 'base64');

    fs.writeFile(`${audioDirectory}/${filename}`, buffer, (err) => {
        if (err) {
            console.error('Error saving audio file:', err);
            return res.status(500).send('Error saving audio');
        }
        res.status(200).send('Audio saved');
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
        console.log('Audio files:', audioFiles); // Log the files
        res.json(audioFiles);
    });
});

// Endpoint to rename audio files
app.post('/api/rename-audio', (req, res) => {
    const { oldName, newName } = req.body;

    // Check for valid names
    if (!oldName || !newName) {
        return res.status(400).send('Both oldName and newName are required');
    }

    const oldPath = path.join(audioDirectory, oldName);
    const newPath = path.join(audioDirectory, newName);

    // Check if the old file exists
    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File does not exist:', oldPath);
            return res.status(404).send('File not found');
        }

        // Check if the new name is the same as the old name
        if (oldName === newName) {
            return res.status(400).send('New name must be different from old name');
        }

        // Check if a file with the new name already exists
        fs.access(newPath, fs.constants.F_OK, (err) => {
            if (!err) {
                console.error('A file with the new name already exists:', newPath);
                return res.status(409).send('A file with that name already exists');
            }

            // Rename the file
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error('Error renaming audio file:', err);
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

    // Check if filenames are provided
    if (!filenames || filenames.length === 0) {
        return res.status(400).send('No audio files provided for merging');
    }

    // Create a temporary text file containing the list of audio files to merge
    const listFilePath = path.join(__dirname, 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) {
            console.error('Error writing list file:', err);
            return res.status(500).send('Error preparing files for merging');
        }

        // Use FFmpeg to merge audio files (make sure FFmpeg is installed)
        const outputPath = path.join(audioDirectory, outputName);
        exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputPath}`, (error) => {
            fs.unlink(listFilePath, () => {}); // Delete the temporary list file
            if (error) {
                console.error('Error merging audio files:', error.message); // Log the error message
                return res.status(500).send('Error merging audios');
            }
            res.status(200).send('Audios merged successfully');
        });
    });
});

// Endpoint to play audio files
app.get('/api/play-audio/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(audioDirectory, filename);
    
    // Set the correct content type for audio files
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending audio file:', err);
            res.status(500).send('Error sending audio');
        }
    });
});

// Endpoint to download audio files
app.get('/api/download-audio/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(audioDirectory, filename);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading audio file:', err);
            res.status(500).send('Error downloading audio');
        }
    });
});

// Endpoint to delete multiple audio files
app.post('/api/delete-audios', (req, res) => {
    const { filenames } = req.body;

    // Check if filenames are provided
    if (!filenames || filenames.length === 0) {
        return res.status(400).send('No audio files provided for deletion');
    }

    // Delete each file
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

    // Wait for all deletions to complete
    Promise.all(deletePromises)
        .then(() => {
            res.status(200).send('Audio files deleted successfully');
        })
        .catch((error) => {
            res.status(500).send(error);
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

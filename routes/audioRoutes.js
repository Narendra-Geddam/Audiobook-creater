const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const mergeService = require('../services/mergeService');
const sanitizeFilename = require('sanitize-filename');
const fs = require('fs');
const path = require('path');

// Directories for generated and mixed audios
const audioDirectory = path.join(__dirname, '../public/generated-audios');
const mixedAudioDirectory = path.join(__dirname, '../public/mixed-audio');

// Helper function to check if a file exists
function fileExists(filePath) {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err); // If no error, file exists
        });
    });
}

// Endpoint to save generated audio files
router.post('/save-audio', async (req, res) => {
    const { filename, data } = req.body;
    const sanitizedFilename = sanitizeFilename(filename);

    try {
        await fileService.saveAudioFile(sanitizedFilename, data);
        res.status(201).send('Audio saved successfully');
    } catch (err) {
        console.error('Error saving audio:', err);
        res.status(500).send('Error saving audio');
    }
});

// Endpoint to get list of generated audios
router.get('/generated-audios', (req, res) => {
    fileService.getGeneratedAudios((err, audioFiles) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        res.json(audioFiles);
    });
});


// Endpoint to rename audio files
router.post('/rename-audio', async (req, res) => {
    const { oldName, newName } = req.body;
    const sanitizedOldName = sanitizeFilename(oldName);
    const sanitizedNewName = sanitizeFilename(newName);

    try {
        await fileService.renameAudioFile(sanitizedOldName, sanitizedNewName);
        res.status(200).send('Audio renamed successfully');
    } catch (err) {
        console.error('Error renaming audio:', err);
        res.status(500).send('Error renaming audio');
    }
});

// Endpoint to merge selected audio files
router.post('/merge-audios', async (req, res) => {
    const { filenames, outputName } = req.body;
    const sanitizedOutputName = sanitizeFilename(outputName);

    try {
        await mergeService.mergeAudios(filenames, sanitizedOutputName);
        res.status(200).send('Audios merged successfully');
    } catch (err) {
        console.error('Error merging audios:', err);
        res.status(500).send('Error merging audios');
    }
});

// Endpoint to delete multiple audio files
router.post('/delete-audios', async (req, res) => {
    const { filenames } = req.body;

    try {
        await fileService.deleteAudios(filenames);
        res.status(204).send(); // No content
    } catch (err) {
        console.error('Error deleting audios:', err);
        res.status(500).send('Error deleting audios');
    }
});

// Endpoint to play generated audio files
router.get('/play-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    fileService.streamAudioFile(filename, req, res);
});

// Endpoint to download generated audio files
router.get('/download-audio/:filename', async (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(audioDirectory, filename);

    console.log(`Attempting to download file: ${filePath}`);

    const exists = await fileExists(filePath);
    if (!exists) {
        console.error('File not found:', filePath);
        return res.status(404).send('File not found');
    }

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            return res.status(500).send('Error downloading file');
        }
        console.log(`File downloaded: ${filename}`);
    });
});

// Endpoint to mix generated audio with background music (BGM)
router.post('/mix-audio', async (req, res) => {
    const { audioFile, bgmFile, outputName } = req.body;
    const sanitizedOutputName = sanitizeFilename(outputName);

    console.log('Mixing audio with BGM:', { audioFile, bgmFile, outputName });

    try {
        await mergeService.mixAudios(audioFile, bgmFile, sanitizedOutputName);
        const outputPath = path.join(mixedAudioDirectory, sanitizedOutputName);
        console.log(`Mixed audio saved to: ${outputPath}`);
        res.status(200).json({ message: 'Audios mixed successfully', outputPath });
    } catch (err) {
        console.error('Mixing error:', err);
        res.status(500).send('Error mixing audios');
    }
});

// Endpoint to get a list of background music files
router.get('/background-music', (req, res) => {
    const bgmDirectory = path.join(__dirname, '../public/background-music');

    fs.readdir(bgmDirectory, (err, files) => {
        if (err) {
            console.error('Error reading background music directory:', err);
            return res.status(500).send('Error reading background music directory');
        }

        const bgmFiles = files.filter(file => file.endsWith('.mp3'));
        res.json(bgmFiles);
    });
});

// Endpoint to get a list of mixed audio files
router.get('/mixed-audio', (req, res) => {
    fs.readdir(mixedAudioDirectory, (err, files) => {
        if (err) {
            console.error('Error reading mixed audio directory:', err);
            return res.status(500).send('Error reading mixed audio directory');
        }

        const mixedAudioFiles = files.filter(file => file.endsWith('.mp3'));
        res.json(mixedAudioFiles);
    });
});

// Endpoint to rename mixed audio files
router.put('/mixed-audio/rename', async (req, res) => {
    const { oldName, newName } = req.body;
    const oldPath = path.join(mixedAudioDirectory, sanitizeFilename(oldName));
    const newPath = path.join(mixedAudioDirectory, sanitizeFilename(newName));

    const exists = await fileExists(newPath);
    if (exists) {
        return res.status(409).json({ message: 'File with the new name already exists' });
    }

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error('Error renaming file:', err);
            return res.status(500).json({ message: 'Error renaming file' });
        }
        res.json({ message: 'File renamed successfully' });
    });
});

// Endpoint to delete a mixed audio file
router.delete('/mixed-audio/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(mixedAudioDirectory, sanitizeFilename(filename));

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Error deleting file');
        }
        res.status(204).send(); // No content
    });
});

// Endpoint to download mixed audio files
router.get('/mixed-audio/:filename', async (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(mixedAudioDirectory, filename);

    console.log(`Attempting to download mixed audio file: ${filePath}`);

    const exists = await fileExists(filePath);
    if (!exists) {
        console.error('Mixed audio file not found:', filePath);
        return res.status(404).send('Mixed audio file not found');
    }

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading mixed audio file:', err);
            return res.status(500).send('Error downloading file');
        }
        console.log(`Mixed audio downloaded: ${filename}`);
    });
});

module.exports = router;

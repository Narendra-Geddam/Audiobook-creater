const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const mergeService = require('../services/mergeService');
const sanitizeFilename = require('sanitize-filename');
const fs = require('fs');
const path = require('path');

// Directory for generated audios
const audioDirectory = path.join(__dirname, '../public/generated-audios');
const mixedAudioDirectory = path.join(__dirname, '../public/mixed-audio'); // New variable for mixed audio directory

// Endpoint to save audio files
router.post('/save-audio', (req, res) => {
    const { filename, data } = req.body;
    const sanitizedFilename = sanitizeFilename(filename);

    fileService.saveAudioFile(sanitizedFilename, data, (err) => {
        if (err) return res.status(500).send('Error saving audio');
        res.status(201).send('Audio saved successfully');
    });
});

// Endpoint to get list of generated audios
router.get('/generated-audios', (req, res) => {
    fileService.getGeneratedAudios((err, audioFiles) => {
        if (err) return res.status(500).send('Internal Server Error');
        res.json(audioFiles);
    });
});

// Endpoint to rename audio files
router.post('/rename-audio', (req, res) => {
    const { oldName, newName } = req.body;
    const sanitizedOldName = sanitizeFilename(oldName);
    const sanitizedNewName = sanitizeFilename(newName);

    fileService.renameAudioFile(sanitizedOldName, sanitizedNewName, (err, statusCode, message) => {
        if (err) return res.status(statusCode).send(message);
        res.status(200).send(message);
    });
});

// Endpoint to merge selected audio files
router.post('/merge-audios', (req, res) => {
    const { filenames, outputName } = req.body;
    const sanitizedOutputName = sanitizeFilename(outputName);

    mergeService.mergeAudios(filenames, sanitizedOutputName, (err) => {
        if (err) return res.status(500).send('Error merging audios');
        res.status(200).send('Audios merged successfully');
    });
});

// Endpoint to delete multiple audio files
router.post('/delete-audios', (req, res) => {
    const { filenames } = req.body;

    fileService.deleteAudios(filenames, (err) => {
        if (err) return res.status(500).send(err);
        res.status(204).send();
    });
});

// Endpoint to play audio files
router.get('/play-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    fileService.streamAudioFile(filename, req, res);
});

// Endpoint to download audio files
router.get('/download-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(audioDirectory, filename);

    console.log(`Attempting to download file: ${filePath}`); // Log download attempt

    // Check if file exists before attempting to download
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            console.error('File not found:', filePath);
            return res.status(404).send('File not found');
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                return res.status(err.status === 404 ? 404 : 500).send('Error downloading file');
            } else {
                console.log(`File downloaded: ${filename}`);
            }
        });
    });
});

// New Endpoint to mix generated audio with BGM
router.post('/mix-audio', (req, res) => {
    const { audioFile, bgmFile, outputName } = req.body;

    console.log('Mixing audio with BGM:', { audioFile, bgmFile, outputName }); // Log input parameters

    mergeService.mixAudios(audioFile, bgmFile, outputName, (err) => {
        if (err) {
            console.error('Mixing error:', err); // Log the error to the server console
            return res.status(500).send('Error mixing audios');
        }

        const outputPath = path.join(mixedAudioDirectory, outputName); // Ensure mixed audio is saved here
        console.log(`Mixed audio saved to: ${outputPath}`); // Log the full path of the mixed audio
        res.status(200).send('Audios mixed successfully');
    });
});

// New Endpoint to get a list of background music files
router.get('/background-music', (req, res) => {
    const bgmDirectory = path.join(__dirname, '../public/background-music');
    
    fs.readdir(bgmDirectory, (err, files) => {
        if (err) return res.status(500).send('Error reading background music directory');
        
        // Filter for only audio files (you can customize this to your needs)
        const bgmFiles = files.filter(file => file.endsWith('.mp3'));
        res.json(bgmFiles);
    });
});

// Endpoint to download mixed audio files
router.get('/mixed-audio/:filename', (req, res) => {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(__dirname, '../public/mixed-audio', filename);

    console.log(`Attempting to download mixed audio file: ${filePath}`);

    fs.stat(filePath, (err) => {
        if (err) {
            console.error('Error downloading mixed audio file:', err);
            return res.status(404).send('Mixed audio file not found');
        }

        res.download(filePath, (downloadError) => {
            if (downloadError) {
                console.error('Error downloading file:', downloadError);
                if (downloadError.status === 404) {
                    return res.status(404).send('File not found');
                }
                return res.status(500).send('Error downloading file');
            } else {
                console.log(`Mixed audio downloaded: ${filename}`);
            }
        });
    });
});


module.exports = router;

const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const mergeService = require('../services/mergeService');
const sanitizeFilename = require('sanitize-filename');

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
    fileService.downloadAudioFile(filename, res);
});

module.exports = router;

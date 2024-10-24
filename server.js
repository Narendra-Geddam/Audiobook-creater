const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const audioRoutes = require('./routes/audioRoutes');
const mergeService = require('./services/mergeService'); // Import your merge service

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve generated audio files
app.use('/audio', express.static(path.join(__dirname, 'public', 'generated-audios')));

// Serve background music files
app.use('/bgm', express.static(path.join(__dirname, 'public', 'background-music')));

// Use audio routes
app.use('/api', audioRoutes);

// Combine audios endpoint
app.post('/api/combine-audios', async (req, res) => {
    const { audioUrls, customName } = req.body; // Capture custom name from the request
    console.log('Received audioUrls:', audioUrls);
    console.log('Received customName:', customName); // Log custom name

    try {
        // Call your combine method in your mergeService, passing the custom name
        const mergedAudioUrl = await mergeService.combineAudioFiles(audioUrls, customName);
        res.json({ mergedAudioUrl });
    } catch (error) {
        console.error('Error combining audios:', error);
        res.status(500).send('Error combining audios');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

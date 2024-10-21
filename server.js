const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const audioRoutes = require('./routes/audioRoutes');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve generated audio files
app.use('/audio', express.static(path.join(__dirname, 'public', 'generated-audios')));

// Serve background music files
app.use('/bgm', express.static(path.join(__dirname, 'public', 'background-music')));

// Use audio routes
app.use('/api', audioRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

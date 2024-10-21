const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const audioRoutes = require('./routes/audioRoutes');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/audio', express.static(path.join(__dirname, 'public', 'generated-audios')));
app.use('/api', audioRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

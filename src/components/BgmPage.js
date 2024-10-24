import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button,
    Select,
    MenuItem,
    Typography,
    Container,
    FormControl,
    InputLabel,
    TextField,
    Snackbar,
    Slider,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import MixedAudioList from './MixedAudioList';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BgmPage = () => {
    const [audios, setAudios] = useState([]);
    const [bgms, setBgms] = useState([]);
    const [selectedAudio, setSelectedAudio] = useState('');
    const [selectedBgm, setSelectedBgm] = useState('');
    const [outputName, setOutputName] = useState('mixed.mp3');
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState('success');
    const [audioVolume, setAudioVolume] = useState(100); // Audio volume (0-100)
    const [bgmVolume, setBgmVolume] = useState(100); // BGM volume (0-100)

    useEffect(() => {
        const fetchAudios = async () => {
            const response = await axios.get('http://localhost:3001/api/generated-audios');
            setAudios(response.data);
        };

        const fetchBgms = async () => {
            const response = await axios.get('http://localhost:3001/api/background-music');
            setBgms(response.data);
        };

        fetchAudios();
        fetchBgms();
    }, []);

    const handleMix = async () => {
        try {
            console.log('Mixing with:', {
                audioFile: selectedAudio,
                bgmFile: selectedBgm,
                outputName,
                audioVolume,
                bgmVolume,
            });

            // Send the mixing request
            await axios.post('http://localhost:3001/api/mix-audio', {
                audioFile: selectedAudio,
                bgmFile: selectedBgm,
                outputName,
                audioVolume, // Include audio volume
                bgmVolume,   // Include BGM volume
            });

            setSnackMessage('Audios mixed successfully');
            setSnackSeverity('success');
            setSnackOpen(true);
        } catch (error) {
            console.error('Error mixing audios:', error);
            setSnackMessage(`Error: ${error.response ? error.response.data : error.message}`);
            setSnackSeverity('error');
            setSnackOpen(true);
        }
    };

    const handleSnackClose = () => {
        setSnackOpen(false);
    };

    return (
        <Container maxWidth="sm" style={{ padding: '20px', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>Mix Background Music with Audio</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Audio File</InputLabel>
                <Select value={selectedAudio} onChange={(e) => setSelectedAudio(e.target.value)}>
                    {audios.map(audio => <MenuItem key={audio} value={audio}>{audio}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Background Music</InputLabel>
                <Select value={selectedBgm} onChange={(e) => setSelectedBgm(e.target.value)}>
                    {bgms.map(bgm => <MenuItem key={bgm} value={bgm}>{bgm}</MenuItem>)}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                margin="normal"
                variant="outlined"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="Output Name"
            />
            
            {/* Audio Volume Slider */}
            <Typography gutterBottom>Audio Volume: {audioVolume}%</Typography>
            <Slider
                value={audioVolume}
                onChange={(e, newValue) => setAudioVolume(newValue)}
                aria-labelledby="audio-volume-slider"
                step={1}
                marks
                min={0}
                max={100}
            />

            {/* BGM Volume Slider */}
            <Typography gutterBottom>BGM Volume: {bgmVolume}%</Typography>
            <Slider
                value={bgmVolume}
                onChange={(e, newValue) => setBgmVolume(newValue)}
                aria-labelledby="bgm-volume-slider"
                step={1}
                marks
                min={0}
                max={100}
            />

            <Button variant="contained" color="primary" onClick={handleMix} style={{ marginTop: '20px' }}>
                Mix
            </Button>

            <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackSeverity}>
                    {snackMessage}
                </Alert>
            </Snackbar>
            <MixedAudioList />
        </Container>
    );
};

export default BgmPage;

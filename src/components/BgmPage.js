import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Select, MenuItem, Typography, Container, FormControl, InputLabel, TextField, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

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
            });

            // Send the mixing request
            const response = await axios.post('http://localhost:3001/api/mix-audio', {
                audioFile: selectedAudio,
                bgmFile: selectedBgm,
                outputName,
            });
            console.log('Mixing response:', response.data);

            setSnackMessage('Audios mixed successfully');
            setSnackSeverity('success');
            setSnackOpen(true);

            // Download the mixed file
            const downloadResponse = await axios.get(`http://localhost:3001/api/mixed-audio/${outputName}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', outputName);
            document.body.appendChild(link);
            link.click();
            link.remove();
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
            <Button variant="contained" color="primary" onClick={handleMix} style={{ marginTop: '20px' }}>
                Mix
            </Button>

            <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackSeverity}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default BgmPage;

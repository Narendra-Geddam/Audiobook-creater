import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Select, MenuItem, Typography } from '@mui/material';

const BgmPage = () => {
    const [audios, setAudios] = useState([]);
    const [bgms, setBgms] = useState([]);
    const [selectedAudio, setSelectedAudio] = useState('');
    const [selectedBgm, setSelectedBgm] = useState('');
    const [outputName, setOutputName] = useState('mixed.mp3');

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
            console.log('Mixing response:', response.data); // Log the response

            alert('Audios mixed successfully');

            // Download the mixed file
            const downloadResponse = await axios.get(`http://localhost:3001/api/download-audio/${outputName}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', outputName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error mixing audios:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Typography variant="h6">Mix Background Music with Audio</Typography>
            <Select value={selectedAudio} onChange={(e) => setSelectedAudio(e.target.value)}>
                {audios.map(audio => <MenuItem key={audio} value={audio}>{audio}</MenuItem>)}
            </Select>
            <Select value={selectedBgm} onChange={(e) => setSelectedBgm(e.target.value)}>
                {bgms.map(bgm => <MenuItem key={bgm} value={bgm}>{bgm}</MenuItem>)}
            </Select>
            <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="Output Name"
            />
            <Button onClick={handleMix}>Mix</Button>
        </div>
    );
};

export default BgmPage;

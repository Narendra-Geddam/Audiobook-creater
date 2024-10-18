import React, { useState } from 'react';
import {
    Button,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    ListItemSecondaryAction,
    TextField,
    Typography,
    IconButton,
} from '@mui/material';
import { Edit as EditIcon, Download as DownloadIcon, Delete as DeleteIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import axios from 'axios';

const AudioList = ({ audios, onRefresh }) => {
    const [selectedAudios, setSelectedAudios] = useState([]);
    const [editingAudio, setEditingAudio] = useState(null);
    const [newName, setNewName] = useState('');
    const [playingAudio, setPlayingAudio] = useState(null);
    const audioRef = React.useRef(null); // Reference to the audio element

    const handleToggle = (audio) => {
        const newSelected = selectedAudios.includes(audio)
            ? selectedAudios.filter((a) => a !== audio)
            : [...selectedAudios, audio];

        setSelectedAudios(newSelected);
    };

    const handleRename = async (oldName) => {
        if (!newName.trim()) {
            alert('Please enter a new name');
            return;
        }

        try {
            // Send request to rename the audio
            await axios.post('http://localhost:3001/api/rename-audio', {
                oldName,
                newName: newName.trim(),
            });

            // Call onRefresh to refresh the audio list
            onRefresh();
            setEditingAudio(null); // Reset editing state
            setNewName(''); // Clear new name after renaming
        } catch (error) {
            console.error('Error renaming audio:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const handleDelete = async (filenames) => {
        if (window.confirm(`Are you sure you want to delete these files: ${filenames.join(', ')}?`)) {
            try {
                await axios.post('http://localhost:3001/api/delete-audios', { filenames });
                onRefresh(); // Callback to refresh the audio list
                setSelectedAudios([]); // Reset selection
            } catch (error) {
                console.error('Error deleting audio files:', error);
                alert(`Error: ${error.response ? error.response.data : error.message}`);
            }
        }
    };

    const handleMerge = async () => {
        if (selectedAudios.length === 0) {
            alert('Please select at least one audio file to merge');
            return;
        }

        const outputName = prompt('Enter output audio name (e.g., merged.mp3)') || 'merged.mp3';

        try {
            await axios.post('http://localhost:3001/api/merge-audios', {
                filenames: selectedAudios,
                outputName,
            });
            alert('Audios merged successfully');
            setSelectedAudios([]); // Reset selection
            onRefresh(); // Refresh the audio list after merging
        } catch (error) {
            console.error('Error merging audios:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/download-audio/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedAudios.length === 0) {
            alert('Please select at least one audio file to download');
            return;
        }

        const downloadPromises = selectedAudios.map((audio) =>
            axios.get(`http://localhost:3001/api/download-audio/${audio}`, { responseType: 'blob' })
        );

        try {
            const responses = await Promise.all(downloadPromises);
            responses.forEach((response, index) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', selectedAudios[index]);
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        } catch (error) {
            console.error('Error downloading selected audios:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const handlePlay = (audio) => {
        if (playingAudio === audio) {
            setPlayingAudio(null); // Stop if the same audio is clicked again
            audioRef.current.pause(); // Pause audio
            audioRef.current.src = ""; // Clear the source
        } else {
            setPlayingAudio(audio);
            audioRef.current.src = `http://localhost:3001/api/play-audio/${audio}`; // Set the audio source
            audioRef.current.play(); // Play the audio
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f4f8' }}>
            <Typography variant="h6" style={{ color: '#2c3e50' }}>Audio Files</Typography>
            {/* Buttons for Downloading, Merging, and Deleting Selected Audios */}
            <div style={{ marginTop: '20px', display: selectedAudios.length > 0 ? 'flex' : 'none', justifyContent: 'space-between' }}>
                <Button variant="contained" onClick={handleDownloadSelected} color="primary">
                    Download Selected
                </Button>
                <Button variant="contained" onClick={handleMerge} color="secondary">
                    Merge Selected
                </Button>
                <Button variant="contained" onClick={() => handleDelete(selectedAudios)} color="error">
                    Delete Selected
                </Button>
            </div>
            <List>
                {audios.map((audio) => (
                    <ListItem key={audio} onClick={() => handleToggle(audio)} style={{ backgroundColor: selectedAudios.includes(audio) ? '#d1f7d3' : '#ffffff' }}>
                        <Checkbox
                            edge="start"
                            checked={selectedAudios.includes(audio)}
                            tabIndex={-1}
                            disableRipple
                        />
                        <ListItemText primary={audio} />
                        <ListItemSecondaryAction>
                            <IconButton onClick={() => handlePlay(audio)} style={{ marginRight: '8px' }}>
                                <PlayArrowIcon />
                            </IconButton>
                            {editingAudio === audio ? (
                                <>
                                    <TextField
                                        label="New Name"
                                        variant="outlined"
                                        size="small"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onBlur={() => { 
                                            // Reset editing state if user clicks outside
                                            handleRename(audio); // Rename on blur
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleRename(audio); // Rename on Enter
                                            }
                                        }}
                                    />
                                    <Button onClick={() => handleRename(audio)}>Rename</Button>
                                </>
                            ) : (
                                <>
                                    <IconButton onClick={() => { 
                                        setEditingAudio(audio); 
                                        setNewName(audio); // Set newName to current audio name
                                    }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDownload(audio)}>
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete([audio])}>
                                        <DeleteIcon />
                                    </IconButton>
                                </>
                            )}
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
            <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
        </div>
    );
};

export default AudioList;

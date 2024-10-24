import React, { useState, useRef, useEffect } from 'react';
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
    LinearProgress,
    Box,
} from '@mui/material';
import {
    Edit as EditIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const AudioList = ({ audios, onRefresh }) => {
    const [selectedAudios, setSelectedAudios] = useState([]);
    const [editingAudio, setEditingAudio] = useState(null);
    const [newName, setNewName] = useState('');
    const [playingAudio, setPlayingAudio] = useState(null);
    const [progress, setProgress] = useState({});
    const audioRef = useRef(null);

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
            await axios.post('http://localhost:3001/api/rename-audio', {
                oldName,
                newName: newName.trim(),
            });

            onRefresh();
            setEditingAudio(null);
            setNewName('');
        } catch (error) {
            console.error('Error renaming audio:', error);
            alert(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const handleDelete = async (filenames) => {
        if (window.confirm(`Are you sure you want to delete these files: ${filenames.join(', ')}?`)) {
            try {
                await axios.post('http://localhost:3001/api/delete-audios', { filenames });
                onRefresh();
                setSelectedAudios([]);
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
            setSelectedAudios([]);
            onRefresh();
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

    const handlePlayPause = (audio) => {
        if (playingAudio === audio) {
            audioRef.current.pause();
            setPlayingAudio(null);
        } else {
            setPlayingAudio(audio);
            audioRef.current.src = `http://localhost:3001/api/play-audio/${audio}`;
            audioRef.current.play();
        }
    };

    const handleProgressChange = (audio, event) => {
        const { value } = event.target;
        if (audioRef.current && playingAudio === audio) {
            audioRef.current.currentTime = (audioRef.current.duration * value) / 100;
        }
    };

    useEffect(() => {
        const audioElement = audioRef.current; // Create a variable to hold the ref value
    
        if (audioElement) {
            const handleTimeUpdate = () => {
                const progressValue = (audioElement.currentTime / audioElement.duration) * 100;
                setProgress((prevProgress) => ({
                    ...prevProgress,
                    [playingAudio]: progressValue,
                }));
            };
    
            audioElement.addEventListener('timeupdate', handleTimeUpdate);
    
            return () => {
                if (audioElement) {
                    audioElement.removeEventListener('timeupdate', handleTimeUpdate);
                }
            };
        }
    }, [playingAudio]);
    

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f4f8' }}>
            <Typography variant="h6" style={{ color: '#2c3e50' }}>Audio Files</Typography>
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
                    <ListItem key={audio} style={{ backgroundColor: selectedAudios.includes(audio) ? '#d1f7d3' : '#ffffff', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Checkbox
                                edge="start"
                                checked={selectedAudios.includes(audio)}
                                tabIndex={-1}
                                disableRipple
                                onClick={() => handleToggle(audio)}
                            />
                            <ListItemText primary={audio} />
                            <ListItemSecondaryAction>
                                <IconButton onClick={() => handlePlayPause(audio)} style={{ marginRight: '8px' }}>
                                    {playingAudio === audio ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                                {editingAudio === audio ? (
                                    <>
                                        <TextField
                                            label="New Name"
                                            variant="outlined"
                                            size="small"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onBlur={() => handleRename(audio)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleRename(audio);
                                                }
                                            }}
                                        />
                                        <Button onClick={() => handleRename(audio)}>Rename</Button>
                                    </>
                                ) : (
                                    <>
                                        <IconButton onClick={() => { 
                                            setEditingAudio(audio); 
                                            setNewName(audio); 
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
                        </div>
                        {playingAudio === audio && (
                            <Box sx={{ width: '100%', mt: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress[audio] || 0}
                                    onClick={(e) => handleProgressChange(audio, e)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </Box>
                        )}
                    </ListItem>
                ))}
            </List>
            <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
        </div>
    );
};

export default AudioList;

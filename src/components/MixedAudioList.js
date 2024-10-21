import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Checkbox,
    TextField,
    Snackbar,
    Alert,
    Divider,
    IconButton
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const MixedAudioList = () => {
    const [mixedAudios, setMixedAudios] = useState([]);
    const [selectedAudios, setSelectedAudios] = useState([]);
    const [renamingAudio, setRenamingAudio] = useState(null);
    const [newAudioName, setNewAudioName] = useState('');
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState('success');
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        const fetchMixedAudios = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/mixed-audio');
                setMixedAudios(response.data);
            } catch (error) {
                console.error('Error fetching mixed audios:', error);
                setSnackMessage('Error fetching mixed audios');
                setSnackSeverity('error');
                setSnackOpen(true);
            }
        };

        fetchMixedAudios();
    }, []);

    const handleDownload = (filenames) => {
        filenames.forEach(filename => {
            axios.get(`http://localhost:3001/api/mixed-audio/${filename}`, { responseType: 'blob' })
                .then(response => {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                })
                .catch(error => {
                    console.error('Error downloading file:', error);
                    setSnackMessage('Error downloading file');
                    setSnackSeverity('error');
                    setSnackOpen(true);
                });
        });
    };

    const handleDelete = async (filenames) => {
        try {
            await Promise.all(filenames.map(filename => axios.delete(`http://localhost:3001/api/mixed-audio/${filename}`)));
            setMixedAudios(prev => prev.filter(audio => !filenames.includes(audio)));
            setSnackMessage('Selected audios deleted successfully');
            setSnackSeverity('success');
            setSnackOpen(true);
            setSelectedAudios([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error deleting files:', error);
            setSnackMessage('Error deleting files');
            setSnackSeverity('error');
            setSnackOpen(true);
        }
    };

    const handleSnackClose = () => {
        setSnackOpen(false);
    };

    const handleToggleAudio = (audio) => {
        setSelectedAudios(prevSelected => {
            if (prevSelected.includes(audio)) {
                return prevSelected.filter(item => item !== audio);
            } else {
                return [...prevSelected, audio];
            }
        });
    };

    const handleSelectAll = (event) => {
        const checked = event.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedAudios(mixedAudios);
        } else {
            setSelectedAudios([]);
        }
    };

    const handleRename = (audio) => {
        setRenamingAudio(audio);
        setNewAudioName(audio.replace('.mp3', '')); // Remove file extension for editing
    };

    const handleRenameChange = (event) => {
        setNewAudioName(event.target.value);
    };

    const handleSaveRename = async (audio) => {
        try {
            const newFileName = `${newAudioName}.mp3`;
            await axios.put(`http://localhost:3001/api/mixed-audio/rename`, { oldName: audio, newName: newFileName });
            setMixedAudios(prev => prev.map(a => (a === audio ? newFileName : a)));
            setSnackMessage('Audio renamed successfully');
            setSnackSeverity('success');
            setSnackOpen(true);
            setRenamingAudio(null);
        } catch (error) {
            console.error('Error renaming file:', error);
            setSnackMessage('Error renaming file');
            setSnackSeverity('error');
            setSnackOpen(true);
        }
    };

    return (
        <div>
            <List>
                {mixedAudios.length > 0 && (
                    <ListItem>
                        {selectedAudios.length > 0 && (
                            <>
                                <ListItemIcon>
                                    <Checkbox
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Select All" />
                                <ListItemIcon>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={() => handleDownload(selectedAudios)} 
                                        startIcon={<GetAppIcon />}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Download Selected
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        color="error" 
                                        onClick={() => handleDelete(selectedAudios)} 
                                        startIcon={<DeleteIcon />}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Delete Selected
                                    </Button>
                                </ListItemIcon>
                            </>
                        )}
                    </ListItem>
                )}
                <Divider />
                {mixedAudios.map((audio, index) => (
                    <ListItem key={index}>
                        <ListItemIcon>
                            <Checkbox
                                checked={selectedAudios.includes(audio)}
                                onChange={() => handleToggleAudio(audio)}
                            />
                        </ListItemIcon>
                        {renamingAudio === audio ? (
                            <>
                                <TextField
                                    value={newAudioName}
                                    onChange={handleRenameChange}
                                    variant="outlined"
                                    size="small"
                                    style={{ width: '50%' }}
                                />
                                <IconButton onClick={() => handleSaveRename(audio)} color="primary">
                                    <SaveIcon />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <ListItemText primary={audio} />
                                <IconButton onClick={() => handleRename(audio)} color="default">
                                    <EditIcon />
                                </IconButton>
                            </>
                        )}
                        <ListItemIcon>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => handleDownload([audio])}
                                startIcon={<GetAppIcon />}
                            >
                                Download
                            </Button>
                        </ListItemIcon>
                    </ListItem>
                ))}
            </List>
            <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackSeverity}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default MixedAudioList;

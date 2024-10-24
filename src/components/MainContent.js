import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import VoiceSelector from './VoiceSelector';
import TextInput from './TextInput';
import GeneratedAudio from './GeneratedAudio';
import AudioList from './AudioList';

const MainContent = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [audioUrls, setAudioUrls] = useState([]); // Store multiple audio URLs
    const [loading, setLoading] = useState(false);
    const [audios, setAudios] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const CHARACTER_LIMIT = 5000; // Set limit for each chunk

    // Chunk the input text based on byte size
    const chunkText = (text) => {
        const chunks = [];
        let currentChunk = '';

        for (let char of text) {
            // Check if adding the next character exceeds the byte limit
            if (new TextEncoder().encode(currentChunk + char).length > CHARACTER_LIMIT) {
                if (currentChunk) {
                    chunks.push(currentChunk); // Push the current chunk if it exceeds the limit
                }
                currentChunk = char; // Start a new chunk with the current character
            } else {
                currentChunk += char; // Add the character to the current chunk
            }
        }

        // Push the last chunk if it exists
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    };

    const fetchGeneratedAudios = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/generated-audios');
            setAudios(response.data);
        } catch (error) {
            console.error('Error fetching audios', error);
            setErrorMessage(`Error fetching audios: ${error.message}`);
        }
    };

    const handleTextSubmit = async (text, customName) => {
        setLoading(true);
        setErrorMessage('');
        setAudioUrls([]);

        try {
            if (!selectedVoice) {
                throw new Error('No voice selected');
            }

            const chunks = chunkText(text); // Chunk the input text
            const generatedAudioUrls = []; // Store the filenames for merging

            for (const chunk of chunks) {
                console.log(`Chunk size (bytes): ${new TextEncoder().encode(chunk).length}`);
                console.log(`Sending chunk to API: ${chunk}`);

                const data = {
                    input: { text: chunk },
                    voice: { languageCode: selectedLanguage, name: selectedVoice },
                    audioConfig: { audioEncoding: 'MP3' },
                };

                const response = await axios.post(
                    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
                    data
                );

                const audioContent = response.data.audioContent;
                const filename = customName ? `${customName}.mp3` : `Untitled_${Date.now()}.mp3`;

                await axios.post('http://localhost:3001/api/save-audio', {
                    filename,
                    data: audioContent,
                });

                generatedAudioUrls.push(filename); // Store the filename for merging
            }

            // Now send the audio URLs and custom name to the combine audios endpoint
            const mergeResponse = await axios.post('http://localhost:3001/api/combine-audios', {
                audioUrls: generatedAudioUrls,
                customName, // Send the custom name here
            });

            const mergedAudioUrl = mergeResponse.data.mergedAudioUrl;
            setAudioUrls([mergedAudioUrl]);
        } catch (error) {
            console.error('Error generating speech:', error);
            setErrorMessage(`Error generating speech: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async (oldName, newName) => {
        try {
            await axios.post('http://localhost:3001/api/rename-audio', { oldName, newName });
            alert(`Successfully renamed to "${newName}"`);
            fetchGeneratedAudios(); // Refresh the audio list after renaming
        } catch (error) {
            console.error('Error renaming audio:', error);
            alert(`Error renaming audio: ${error.response ? error.response.data : error.message}`);
        }
    };

    useEffect(() => {
        fetchGeneratedAudios(); // Fetch audios on component mount
    }, []);

    return (
        <Container maxWidth="xxl" sx={{ padding: 2, margin: '0 auto' }}>
            <Typography variant="h3" align="center" gutterBottom>
                Extraordinary Audiobook Generator
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
                {/* Left Side: Main content */}
                <Box sx={{ flex: 3, paddingRight: 2 }}>
                    <VoiceSelector 
                        onLanguageSelect={setSelectedLanguage}
                        onVoiceSelect={setSelectedVoice}
                    />
                    <TextInput onSubmit={handleTextSubmit} />
                    {loading ? (
                        <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
                    ) : (
                        <>
                            {errorMessage && (
                                <Typography color="error" align="center">{errorMessage}</Typography>
                            )}
                            {audioUrls.map((url, index) => (
                                <GeneratedAudio key={index} audioUrl={url} />
                            ))}
                        </>
                    )}
                </Box>

                {/* Right Side: Audio List */}
                <Box sx={{ flex: 2, maxWidth: '600px', paddingLeft: 2 }}>
                    <AudioList audios={audios} onRefresh={fetchGeneratedAudios} onRename={handleRename} />
                </Box>
            </Box>
        </Container>
    );
};

export default MainContent;

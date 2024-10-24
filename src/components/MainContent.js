import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import VoiceSelector from './VoiceSelector';
import TextInput from './TextInput';
import GeneratedAudio from './GeneratedAudio';
import AudioList from './AudioList';

const MainContent = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('selectedLanguage') || 'en-US');
    const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('selectedVoice') || '');
    const [audioUrls, setAudioUrls] = useState([]); // Store multiple audio URLs
    const [loading, setLoading] = useState(false);
    const [audios, setAudios] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const CHARACTER_LIMIT = 5000; // Set limit for each chunk

    useEffect(() => {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }, [selectedLanguage]);

    useEffect(() => {
        localStorage.setItem('selectedVoice', selectedVoice);
    }, [selectedVoice]);

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
            setErrorMessage(`Error fetching audios: ${error.message}`); // Corrected string interpolation
        }
    };

    const handleTextSubmit = async (text, customName) => {
        setLoading(true);
        setErrorMessage(''); // Clear previous error
        setAudioUrls([]); // Reset audio URLs

        try {
            if (!selectedVoice) {
                throw new Error('No voice selected');
            }

            const textByteLength = new TextEncoder().encode(text).length;

            // Case 1: If the text length is under or equal to 5000 bytes, handle it in a single request
            if (textByteLength <= CHARACTER_LIMIT) {
                const data = {
                    input: { text },
                    voice: { languageCode: selectedLanguage, name: selectedVoice },
                    audioConfig: { audioEncoding: 'MP3' },
                };

                const response = await axios.post(
                    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
                    data
                );

                if (response.status !== 200) {
                    throw new Error(`API response status: ${response.status}`); // Corrected string interpolation
                }

                const audioContent = response.data.audioContent;
                const filename = customName ? `${customName}.mp3` : `untitled_${Date.now()}.mp3`; // Generating a unique filename

                // Save the generated audio file
                await axios.post('http://localhost:3001/api/save-audio', {
                    filename,
                    data: audioContent,
                });

                // Set audio URL for playback
                setAudioUrls([`/generated-audios/${filename}`]);

            } else {
                // Case 2: If the text length exceeds 5000 bytes, split it into chunks and combine audios
                const chunks = chunkText(text);
                const generatedAudioUrls = [];

                // Process each chunk separately
                for (const [index, chunk] of chunks.entries()) {
                    console.log(`Processing chunk size: ${new TextEncoder().encode(chunk).length}`);

                    const data = {
                        input: { text: chunk },
                        voice: { languageCode: selectedLanguage, name: selectedVoice },
                        audioConfig: { audioEncoding: 'MP3' },
                    };

                    const response = await axios.post(
                        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
                        data
                    );

                    if (response.status !== 200) {
                        throw new Error(`API response status: ${response.status}`); // Corrected string interpolation
                    }

                    const audioContent = response.data.audioContent;
                    const chunkFilename = `${customName ? customName : 'Untitled'}_Part_${index + 1}.mp3`;

                    // Save the generated audio file for each chunk
                    await axios.post('http://localhost:3001/api/save-audio', {
                        filename: chunkFilename,
                        data: audioContent,
                    });

                    generatedAudioUrls.push(chunkFilename); // Store filename for later merging
                }

                // Merge audio chunks into a single audio file
                const mergeResponse = await axios.post('http://localhost:3001/api/combine-audios', {
                    audioUrls: generatedAudioUrls,
                    customName, // Use the custom name if provided
                });

                const mergedAudioUrl = mergeResponse.data.mergedAudioUrl;
                setAudioUrls([mergedAudioUrl]);
            }

        } catch (error) {
            console.error('Error generating speech:', error);
            setErrorMessage(`Error generating speech: ${error.message}`); // Corrected string interpolation
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async (oldName, newName) => {
        try {
            await axios.post('http://localhost:3001/api/rename-audio', { oldName, newName });
            alert(`Successfully renamed to "${newName}"`); // Corrected string interpolation
            fetchGeneratedAudios(); // Refresh the audio list after renaming
        } catch (error) {
            console.error('Error renaming audio:', error);
            alert(`Error renaming audio: ${error.response ? error.response.data : error.message}`); // Corrected string interpolation
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

// components/MainContent.js
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
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchGeneratedAudios = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/generated-audios');
      setAudios(response.data);
    } catch (error) {
      console.error('Error fetching audios', error);
      setErrorMessage(`Error fetching audios: ${error.message}`);
    }
  };

  const handleTextSubmit = async (text) => {
    setLoading(true);
    setErrorMessage(''); // Clear previous error

    try {
      if (!selectedVoice) {
        throw new Error('No voice selected');
      }

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
        throw new Error(`API response status: ${response.status}`);
      }

      const audioContent = response.data.audioContent;
      const filename = `untitled${Date.now()}.mp3`; // Generating a unique filename
      await axios.post('http://localhost:3001/api/save-audio', {
        filename,
        data: audioContent,
      });

      setAudioUrl(`data:audio/mp3;base64,${audioContent}`);

      // Fetch the updated list of audios after generating a new one
      fetchGeneratedAudios();
    } catch (error) {
      console.error('Error generating speech', error);
      setErrorMessage(`Error: ${error.message}`); // Set error message
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
      alert(`Error: ${error.response ? error.response.data : error.message}`);
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
              <GeneratedAudio audioUrl={audioUrl} />
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

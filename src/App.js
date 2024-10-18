import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, CircularProgress } from '@mui/material';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import TextInput from './components/TextInput';
import GeneratedAudio from './components/GeneratedAudio';
import AudioList from './components/AudioList';

const App = () => {
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

  // New rename handler
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
    <>
      <Header />
      <Container maxWidth="md" sx={{ padding: 2 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Extraordinary Audiobook Generator
        </Typography>
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
        {/* Pass the handleRename function to AudioList */}
        <AudioList audios={audios} onRefresh={fetchGeneratedAudios} onRename={handleRename} />
      </Container>
    </>
  );
};

export default App;

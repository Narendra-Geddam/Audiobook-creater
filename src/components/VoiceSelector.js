import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const VoiceSelector = ({ onLanguageSelect, onVoiceSelect }) => {
  const [languages, setLanguages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('');

  // Updated list of available languages with emoji flags
  const languageOptions = {
    'af-ZA': 'Afrikaans (South Africa) 🇿🇦',
    'am-ET': 'Amharic (Ethiopia) 🇪🇹',
    'bg-BG': 'Bulgarian (Bulgaria) 🇧🇬',
    'bn-IN': 'Bengali (India) 🇮🇳',
    'ca-ES': 'Catalan (Spain) 🇪🇸',
    'cmn-Hans-CN': 'Chinese (Simplified) 🇨🇳',
    'cmn-Hant-TW': 'Chinese (Traditional) 🇹🇼',
    'cs-CZ': 'Czech (Czech Republic) 🇨🇿',
    'da-DK': 'Danish (Denmark) 🇩🇰',
    'de-DE': 'German (Germany) 🇩🇪',
    'el-GR': 'Greek (Greece) 🇬🇷',
    'en-GB': 'English (United Kingdom) 🇬🇧',
    'en-IN': 'English (India) 🇮🇳',
    'en-US': 'English (United States) 🇺🇸',
    'es-ES': 'Spanish (Spain) 🇪🇸',
    'es-US': 'Spanish (United States) 🇺🇸',
    'eu-ES': 'Basque (Spain) 🇪🇸',
    'fi-FI': 'Finnish (Finland) 🇫🇮',
    'fil-PH': 'Filipino (Philippines) 🇵🇭',
    'fr-FR': 'French (France) 🇫🇷',
    'gl-ES': 'Galician (Spain) 🇪🇸',
    'gu-IN': 'Gujarati (India) 🇮🇳',
    'he-IL': 'Hebrew (Israel) 🇮🇱',
    'hi-IN': 'Hindi (India) 🇮🇳',
    'hu-HU': 'Hungarian (Hungary) 🇭🇺',
    'id-ID': 'Indonesian (Indonesia) 🇮🇩',
    'is-IS': 'Icelandic (Iceland) 🇮🇸',
    'it-IT': 'Italian (Italy) 🇮🇹',
    'ja-JP': 'Japanese (Japan) 🇯🇵',
    'kn-IN': 'Kannada (India) 🇮🇳',
    'ko-KR': 'Korean (South Korea) 🇰🇷',
    'lt-LT': 'Lithuanian (Lithuania) 🇱🇹',
    'lv-LV': 'Latvian (Latvia) 🇱🇻',
    'ml-IN': 'Malayalam (India) 🇮🇳',
    'mr-IN': 'Marathi (India) 🇮🇳',
    'ms-MY': 'Malay (Malaysia) 🇲🇾',
    'nb-NO': 'Norwegian (Bokmål, Norway) 🇳🇴',
    'nl-BE': 'Dutch (Belgium) 🇧🇪',
    'nl-NL': 'Dutch (Netherlands) 🇳🇱',
    'pa-IN': 'Punjabi (India) 🇮🇳',
    'pl-PL': 'Polish (Poland) 🇵🇱',
    'pt-BR': 'Portuguese (Brazil) 🇧🇷',
    'pt-PT': 'Portuguese (Portugal) 🇵🇹',
    'ro-RO': 'Romanian (Romania) 🇷🇴',
    'ru-RU': 'Russian (Russia) 🇷🇺',
    'sk-SK': 'Slovak (Slovakia) 🇸🇰',
    'sr-RS': 'Serbian (Serbia) 🇷🇸',
    'sv-SE': 'Swedish (Sweden) 🇸🇪',
    'ta-IN': 'Tamil (India) 🇮🇳',
    'te-IN': 'Telugu (India) 🇮🇳',
    'th-TH': 'Thai (Thailand) 🇹🇭',
    'tr-TR': 'Turkish (Turkey) 🇹🇷',
    'uk-UA': 'Ukrainian (Ukraine) 🇺🇦',
    'ur-IN': 'Urdu (India) 🇮🇳',
    'vi-VN': 'Vietnamese (Vietnam) 🇻🇳',
    'yue-HK': 'Cantonese (Hong Kong) 🇭🇰',
  };

  useEffect(() => {
    setLanguages(Object.entries(languageOptions).map(([code, label]) => ({ code, label })));
    fetchVoices(selectedLanguage); // eslint-disable-next-line
  }, [selectedLanguage]);

  const fetchVoices = async (language) => {
    // Fetch available voices for the selected language from Google TTS API
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${process.env.REACT_APP_GOOGLE_API_KEY}`);
      const data = await response.json();
      const filteredVoices = data.voices.filter(voice => voice.languageCodes.includes(language));
      setVoices(filteredVoices);
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const handleLanguageChange = (event) => {
    const language = event.target.value;
    setSelectedLanguage(language);
    onLanguageSelect(language); // Notify parent about language change
    setSelectedVoice(''); // Reset selected voice when language changes
    onVoiceSelect(''); // Clear the voice in parent
    fetchVoices(language); // Fetch voices for new language
  };

  const handleVoiceChange = (event) => {
    const voice = event.target.value;
    setSelectedVoice(voice);
    onVoiceSelect(voice); // Notify parent about voice change
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <FormControl fullWidth margin="normal">
        <InputLabel>Language</InputLabel>
        <Select value={selectedLanguage} onChange={handleLanguageChange}>
          {languages.map(lang => (
            <MenuItem key={lang.code} value={lang.code}>{lang.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Voice</InputLabel>
        <Select value={selectedVoice} onChange={handleVoiceChange} disabled={!voices.length}>
          {voices.map(voice => (
            <MenuItem key={voice.name} value={voice.name}>
              {`${voice.name} (${voice.ssmlGender})`} {/* Display name and gender */}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default VoiceSelector;

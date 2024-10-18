import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Custom styling if needed

const Header = () => {
  const navigate = useNavigate();

  const handleCloneVoice = () => {
    navigate('/clone-voice'); // Navigate to the voice cloning page
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          My Voice App
        </Typography>
        <Button color="inherit" onClick={handleCloneVoice}>
          Clone My Voice
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

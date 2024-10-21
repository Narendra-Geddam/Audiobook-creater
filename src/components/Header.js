// components/Header.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Custom styling if needed

const Header = () => {
  const navigate = useNavigate();

  const handleBgmPage = () => {
    navigate('/bgm'); // Navigate to the BGM page
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          My Voice App
        </Typography>
        <Button color="inherit" onClick={handleBgmPage}>
          Add Background Music
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

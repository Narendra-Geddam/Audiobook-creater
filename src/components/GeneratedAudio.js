import React from 'react';
import { Card, Button } from '@mui/material';

const GeneratedAudio = ({ audioUrl }) => {
  return (
    <Card variant="outlined" sx={{ marginTop: 3, padding: 2 }}>
      {audioUrl && (
        <>
          <audio controls src={audioUrl} style={{ width: '100%' }}></audio>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            href={audioUrl}
            download="output.mp3"
            sx={{ marginTop: 2 }}
          >
            Download Audio
          </Button>
        </>
      )}
    </Card>
  );
};

export default GeneratedAudio;

import React, { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';

const TextInput = ({ onSubmit }) => {
    const [text, setText] = useState('');
    const [customName, setCustomName] = useState(''); // State for custom file name
    const [error, setError] = useState(false);
    const CHARACTER_LIMIT = 10000; // Updated limit to 10,000 characters

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);

        if (newText.length > CHARACTER_LIMIT) {
            setError(true);
        } else {
            setError(false);
        }
    };

    const handleCustomNameChange = (e) => {
        setCustomName(e.target.value); // Update custom name state
    };

    const handleSubmit = () => {
        if (text.length <= CHARACTER_LIMIT) {
            onSubmit(text, customName); // Pass the text input and custom name to the parent
        }
    };

    return (
        <div>
            <TextField
                label="Enter your text"
                variant="outlined"
                fullWidth
                multiline
                rows={10}
                value={text}
                onChange={handleChange}
                helperText={`${text.length}/${CHARACTER_LIMIT} characters`}
                error={error}
                sx={{ marginTop: 2 }}
            />
            {error && (
                <Typography variant="body2" color="error" sx={{ marginTop: 1 }}>
                    Text exceeds the maximum character limit of {CHARACTER_LIMIT} characters.
                </Typography>
            )}
            <TextField
                label="Custom File Name (optional)"
                variant="outlined"
                fullWidth
                value={customName}
                onChange={handleCustomNameChange}
                sx={{ marginTop: 2 }}
            />
            <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={error || text.length === 0}
                sx={{ marginTop: 2 }}
            >
                Generate Audio
            </Button>
        </div>
    );
};

export default TextInput;

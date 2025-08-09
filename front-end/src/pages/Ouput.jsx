import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Avatar, Paper, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

const Output = ({ token: propToken, setToken }) => {
  const navigate = useNavigate();
  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  useEffect(() => {
    if (token) {
      axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const avatarUrl = res.data.avatarUrl || '';
        setAvatar(avatarUrl);
        localStorage.setItem('avatar', avatarUrl);
      })
      .catch(console.error);
    }
  }, [token]);

  const handleDownload = () => {
    // TODO: implement download logic
  };

  return (
    <Box>
      <AppBar position="static" sx={{ bgcolor: '#333' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              alt="User Avatar"
              src={avatar || undefined}
              sx={{ cursor: 'pointer', bgcolor: avatar ? 'transparent' : '#eee' }}
              onClick={() => navigate('/profile')}
            />
            {token && <Logout token={token} setToken={setToken} />}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Paper
            elevation={4}
            sx={{ width: 400, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Typography>Output Preview</Typography>
          </Paper>
          <Button variant="contained" onClick={handleDownload} sx={{ height: 40 }}>
            Download
          </Button>
          <Button variant="contained" onClick={() => navigate('/InferParameter')} sx={{ height: 40 }}>
            Back
          </Button>
        </Box>
        
      </Container>
    </Box>
  );
};

export default Output;

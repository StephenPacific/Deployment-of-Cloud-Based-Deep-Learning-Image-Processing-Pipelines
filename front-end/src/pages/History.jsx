import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, List, ListItem,
  ListItemText, Divider, CircularProgress,
  AppBar, Toolbar, Avatar
} from '@mui/material';
import Logout from '../pages/Logout.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const History = ({ token: propToken, setToken }) => {
  const navigate = useNavigate();

  const [tokenState, setTokenState] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenState) {
      navigate('/login');
    }
  }, [tokenState, navigate]);

  useEffect(() => {
    if (!tokenState) return;
    axios.get('/api/profile', {
      headers: { Authorization: `Bearer ${tokenState}` }
    }).then(res => {
      const avatarUrl = res.data.avatarUrl || '';
      setAvatar(avatarUrl);
      localStorage.setItem('avatar', avatarUrl);
    }).catch(console.error);
  }, [tokenState]);

  useEffect(() => {
    if (!tokenState) return;
    setLoading(true);
    axios.get('/api/history', {
      headers: { Authorization: `Bearer ${tokenState}` }
    })
      .then(res => {
        setHistoryData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setHistoryData([]);
        setLoading(false);
        console.error('Fetch history error:', err);
      });
  }, [tokenState]);

  // 这里是自动跳转的逻辑
  const handleReuseModel = (item) => {
    if (item.preprocess_status === 'preprocessed') {
      navigate(`/preprocess?history_id=${item.history_id}`);
    } else {
      navigate(`/preview?history_id=${item.history_id}`);
    }
  };

  return (
    <Box>
      <AppBar position="static" sx={{ bgcolor: '#333' }}>
        <Toolbar>
          <Box
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
            role="button"
            tabIndex={0}
            onKeyPress={e => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard');
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', userSelect: 'none' }}>
              Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              alt="User Avatar"
              src={avatar || undefined}
              sx={{ cursor: 'pointer', bgcolor: avatar ? 'transparent' : '#eee' }}
              onClick={() => navigate('/profile')}
            />
            {tokenState && (
              <Logout token={tokenState} setToken={t => {
                setTokenState(t);
                setToken(t);
              }} />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Training History
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : historyData.length === 0 ? (
          <Typography align="center" mt={4}>No training history found.</Typography>
        ) : (
          <List>
            {historyData.map((item, idx) => (
              <React.Fragment key={item.history_id}>
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <ListItemText
                    primary={
                      <span>
                        <b>[{item.train_status || 'untrained'}]</b>
                        <span style={{ marginLeft: 12, fontWeight: 400, color: '#888', fontSize: 17 }}>
                          ID: {item.history_id} | Preprocess: {item.preprocess_status || 'unpreprocessed'}
                        </span>
                      </span>
                    }
                    secondary={item.createtime ? `Created: ${item.createtime}` : null}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleReuseModel(item)}
                    >
                      USE THIS MODEL
                    </Button>
                  </Box>
                </ListItem>
                {idx < historyData.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Container>
    </Box>
  );
};

export default History;

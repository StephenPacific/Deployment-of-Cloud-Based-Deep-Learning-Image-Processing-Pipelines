import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Container,
  AppBar, Toolbar, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

const Dashboard = ({ token: propToken, setToken }) => {
  const navigate = useNavigate();
  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  // 拉取头像
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const avatarUrl = res.data.avatarUrl || '';
        setAvatar(avatarUrl);
        localStorage.setItem('avatar', avatarUrl);
      } catch (err) {
        console.error("Failed to fetch avatar:", err);
      }
    };
    if (token) fetchAvatar();
  }, [token]);

  return (
    <Box>
      {/* 顶部导航栏 */}
      <AppBar position="static" sx={{ bgcolor: '#333' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Select
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              alt="User Avatar"
              src={avatar || undefined}
              sx={{
                cursor: 'pointer',
                bgcolor: avatar ? 'transparent' : '#eee'
              }}
              onClick={() => navigate('/profile')}
            />
            {token && <Logout token={token} setToken={setToken} />}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 页面主体 */}
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={5}>
          <Typography variant="h4" gutterBottom>
            Choose a Task
          </Typography>

          {/* 超分辨率功能按钮 */}
          <Button
            variant="contained"
            size="large"
            sx={{ width: '70%', py: 2, fontSize: '1.2rem' }}
            onClick={() => navigate('/start')}
          >
            Super-Resolution (SR)
          </Button>

          {/* 历史记录按钮 */}
          <Button
            variant="outlined"
            size="large"
            sx={{ width: '70%', py: 2, fontSize: '1.2rem' }}
            onClick={() => navigate('/history')}
          >
            View History
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;

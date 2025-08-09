import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  AppBar,
  Toolbar,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

function TrainPreview({ token: propToken, setToken }) {
  const navigate = useNavigate();

  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  const [epoch, setEpoch] = useState(0);
  const maxEpoch = 100;

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

  // 模拟训练过程
  const handleStartTraining = () => {
    setEpoch(0);
    const interval = setInterval(() => {
      setEpoch((prev) => {
        if (prev >= maxEpoch) {
          clearInterval(interval);
          return maxEpoch;
        }
        return prev + 1;
      });
    }, 100);
  };

  return (
    <Box>
      {/* 顶部导航栏 */}
      <AppBar position="static" sx={{ bgcolor: '#333' }}>
        <Toolbar>
          <Button
            onClick={() => navigate('/dashboard')}
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1.2rem'
            }}
          >
            Dashboard
          </Button>
          <Box sx={{ flexGrow: 1 }} />
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

      {/* 主体内容 */}
      <Box sx={{ p: 4 }}>
        {/* 标题 */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Training Preview
          </Typography>
        </Box>

        {/* 三个图像块区域 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 4,
            my: 4,
          }}
        >
          {['LR', 'SR', 'HR'].map((label) => (
            <Paper
              key={label}
              elevation={3}
              sx={{
                width: 500,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                color: 'gray',
              }}
            >
              {label}
            </Paper>
          ))}
        </Box>

        {/* 进度条 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Epoch Progress: {epoch} / {maxEpoch}
          </Typography>
          <LinearProgress variant="determinate" value={(epoch / maxEpoch) * 100} />
        </Box>

        {/* 开始训练按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartTraining}
            sx={{
              width: 200,
              height: 56,
              fontSize: '18px',
            }}
          >
            Training Start
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/TrainAndInfer')}
            sx={{
              width: 200,
              height: 56,
              fontSize: '18px',
            }}
          >
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TrainPreview;

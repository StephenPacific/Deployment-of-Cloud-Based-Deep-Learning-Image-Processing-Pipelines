import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

function InferParameter({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');
  const [progress, setProgress] = useState(0);

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

  // 模拟推理进度
  const handleStartInfer = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 80);
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

      {/* 主体内容区域 */}
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Infer Parameter
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          {/* 选择权重 */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="weight-label">Weight</InputLabel>
            <Select
              labelId="weight-label"
              label="Weight"
              defaultValue=""
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
            </Select>
          </FormControl>

          {/* 选择LR */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="lr-label">Select LR</InputLabel>
            <Select
              labelId="lr-label"
              label="Select LR"
              defaultValue=""
            >
              <MenuItem value="lr1">LR 1</MenuItem>
              <MenuItem value="lr2">LR 2</MenuItem>
            </Select>
          </FormControl>

          {/* 容器 3 */}
          <Paper
            elevation={2}
            sx={{
              height: 100,
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'gray',
              fontWeight: 'bold',
            }}
          >
            Placeholder for Container 3
          </Paper>

          {/* 推理进度条 */}
          <Box sx={{ mb: 2 }}>
            <Typography textAlign="center" variant="body1" gutterBottom>
              Inference Progress: {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        </Box>

        {/* 开始推理按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              width: 220,
              height: 56,
              fontSize: '18px',
              fontWeight: 'bold',
            }}
            onClick={handleStartInfer}
          >
            Start Infer
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/TrainAndInfer')}
            sx={{
              width: 200,
              height: 56,
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Back
          </Button>
          <Button variant="contained"
            color="primary"
            size="large"
            sx={{
              width: 220,
              height: 56,
              fontSize: '18px',
              fontWeight: 'bold',
            }} onClick={() => navigate('/output')}>
            Continue
          </Button>

        </Box>
      </Box>
    </Box>
  );
}

export default InferParameter;

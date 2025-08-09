import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Avatar, Box, Button, Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

function TrainAndInfer({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 支持直接跳转和参数跳转
  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  // 解析 history_id（允许为空）
  const historyId = new URLSearchParams(location.search).get('history_id') || '';

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

  // 跳转函数，自动带 history_id 参数（如果有）
  const jumpWithHistory = (path) => {
    if (historyId) {
      navigate(`${path}?history_id=${historyId}`);
    } else {
      navigate(path);
    }
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

      {/* 页面主体内容 */}
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#fff',
        }}
      >
        {/* 标题 */}
        <Box sx={{ position: 'relative', top: '-100px' }}>
          <Typography sx={{ fontSize: '60px', fontWeight: 'bold' }}>
            Train{"\u00A0\u00A0"}&{"\u00A0\u00A0"}Infer
          </Typography>
        </Box>

        {/* 按钮区域 */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ minWidth: 120 }}
            // onClick={() => jumpWithHistory('/TrainPreview')}
            onClick={() => jumpWithHistory('/TrainingOptions')}
          >
            TRAIN
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ minWidth: 120 }}
            onClick={() => jumpWithHistory('/InferParameter')}
          >
            INFER
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TrainAndInfer;

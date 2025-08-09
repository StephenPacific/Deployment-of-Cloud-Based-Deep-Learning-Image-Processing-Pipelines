import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Typography, Container, Grid,
  AppBar, Toolbar, Avatar, Paper, Slider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Logout from '../pages/Logout.jsx';
import TiffCanvas from '../components/TiffCanvas.jsx';

const FILE_HOST = window.location.origin;
const imageBoxSize = 420;

// 严格按百分之10采样（大于10张），10张及以下全部展示
function pickStrict10Percent(arr) {
  const n = arr.length;
  if (n === 0) return [];
  if (n <= 10) return arr.map((url, idx) => ({ idx, url }));
  const idxs = [];
  for (let i = 0; i < 10; i++) {
    idxs.push(Math.floor(i * n / 10));
  }
  idxs.push(n - 1); // 最后一张
  return idxs.map(idx => ({ idx, url: arr[idx] }));
}

// 提取图片编号，如000308
function extractScanNumber(url = "") {
  const match = url.match(/_(\d{6})\.tif$/i);
  if (match) return match[1];
  return url.split('/').pop() || "";
}

function RegistrationPreviewPanel({ title, slicesCount }) {
  const [axis, setAxis] = useState('z');
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const sampleIndices = useMemo(() => {
    const step = Math.ceil(slicesCount / 10);
    const result = [];
    for (let i = step; i <= slicesCount; i += step) {
      result.push(i - 1);
    }
    return result;
  }, [slicesCount]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % sampleIndices.length);
    }, 800);
    return () => clearInterval(timer);
  }, [sampleIndices, isPlaying]);

  return (
    <Grid item xs={12} md={6}>
      <Paper sx={paperStyle}>
        <Typography sx={titleStyle}>{title}</Typography>
        <Box sx={canvasStyle}>
          <Box sx={blankBox}>
            <Typography color="white">Slice #{sampleIndices[idx] + 1} - Axis: {axis.toUpperCase()}</Typography>
            {/* Replace below with actual image rendering */}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          {['x', 'y', 'z'].map(ax => (
            <Button key={ax} variant={axis === ax ? 'contained' : 'outlined'}
              size="small" onClick={() => setAxis(ax)}
              sx={{ mx: 1 }}>
              {ax.toUpperCase()} Axis
            </Button>
          ))}
        </Box>
        <Slider
          sx={slider}
          value={idx}
          min={0}
          max={sampleIndices.length - 1}
          step={1}
          marks={sampleIndices.map((_, i) => ({ value: i, label: `${sampleIndices[i] + 1}` }))}
          onChange={(_, v) => {
            setIsPlaying(false);
            setIdx(v);
          }}
        />
      </Paper>
    </Grid>
  );
}

export default function Preview({ token: propToken, setToken }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const historyId = new URLSearchParams(location.search).get('history_id') || '';

  useEffect(() => {
    console.log('当前路由:', location.pathname + location.search);
    console.log('historyId:', historyId);
  }, [location, historyId]);

  const [token]   = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  const [lrImages, setLrImages] = useState([]);
  const [hrImages, setHrImages] = useState([]);
  const [idxLR,    setIdxLR]    = useState(0);
  const [idxHR,    setIdxHR]    = useState(0);

  const [bLR, setBLR] = useState(0);
  const [cLR, setCLR] = useState(1);
  const [bHR, setBHR] = useState(0);
  const [cHR, setCHR] = useState(1);

  useEffect(() => {
    if (!token) return;
    axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const url = res.data.avatarUrl || '';
        setAvatar(url);
        localStorage.setItem('avatar', url);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token || !historyId) return;
    axios.get(`/api/upload-preview?history_id=${historyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const abs = p => (p.startsWith('http') ? p : FILE_HOST + p);
      const lrArr = (res.data.lr_images || []).map(abs);
      const hrArr = (res.data.hr_images || []).map(abs);
      setLrImages(pickStrict10Percent(lrArr));
      setHrImages(pickStrict10Percent(hrArr));
      setIdxLR(0);
      setIdxHR(0);

      // 调试输出
      console.log('采样LR:', pickStrict10Percent(lrArr).map(x=>x.idx));
      console.log('采样HR:', pickStrict10Percent(hrArr).map(x=>x.idx));
    })
    .catch(err => console.error('Fetch TIFF preview failed:', err));
  }, [token, historyId]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* 顶栏 */}
      <AppBar position="static" sx={{ bgcolor: '#222' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={avatar || undefined} onClick={() => navigate('/profile')}
                    sx={{ cursor: 'pointer', bgcolor: avatar ? 'transparent' : '#eee' }} />
            {token && <Logout token={token} setToken={setToken} />}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 8, mb: 10 }}>
        <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
          TIFF Image Preview
        </Typography>
        <Grid container spacing={7} justifyContent="center" sx={{ mb: 5 }}>
          <ImagePanel
            // Low, High concepts *** 28 JUL 1:05am
            title="Low Resolution Image"
            images={lrImages}
            idx={idxLR}
            setIdx={setIdxLR}
            brightness={bLR}
            contrast={cLR}
            setBrightness={setBLR}
            setContrast={setCLR}
          />
          <ImagePanel
            // Low, High concepts *** 28 JUL 1:05am
            title="High Resolution Image"
            images={hrImages}
            idx={idxHR}
            setIdx={setIdxHR}
            brightness={bHR}
            contrast={cHR}
            setBrightness={setBHR}
            setContrast={setCHR}
          />
        </Grid>

      </Container>

      <Container maxWidth="xl" sx={{ mt: 6, mb: 10, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          sx={goBtn}
          onClick={() => navigate('/preprocess?history_id=' + historyId)}
          disabled={!historyId}
        >
          GO TO PREPROCESS
        </Button>
      </Container>
    </Box>
  );
} 

// 图片面板，图片下方显示编号
function ImagePanel ({
  title, images, idx, setIdx,
  brightness, contrast, setBrightness, setContrast
}) {
  const current = images[idx] || {};
  return (
    <Grid item xs={12} md={5} lg={5} xl={4}>
      <Paper sx={paperStyle}>
        <Typography sx={titleStyle}>{title}</Typography>
        <Box sx={canvasStyle}>
          {images.length > 0
            ? <TiffCanvas url={current.url} brightness={brightness} contrast={contrast}/>
            : <Box sx={blankBox} />}
          {images.length === 0 && (
            <Typography sx={noTiff}>No TIFF</Typography>
          )}
        </Box>
        {/* 图片编号显示块 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" align="center" sx={{ letterSpacing: 1.5 }}>
            {current.url ? `Image Number: ${extractScanNumber(current.url)}` : ''}
          </Typography>
        </Box>
        <Adjust
          brightness={brightness} contrast={contrast}
          setBrightness={setBrightness} setContrast={setContrast}
        />
        {images.length > 1 && (
          <Slider
            sx={slider}
            value={idx}
            min={0}
            max={images.length - 1}
            step={1}
            marks={images.map((img, i) => ({
              value: i,
              label: `${img.idx + 1}`
            }))}
            onChange={(_, v) => setIdx(v)}
          />
        )}
      </Paper>
    </Grid>
  );
}

function Adjust ({ brightness, contrast, setBrightness, setContrast }) {
  return (
    <Box sx={{ width: imageBoxSize - 60, mb: 1 }}>
      <Typography fontSize={13.5} color="text.secondary" mb={-0.7}>Brightness</Typography>
      <Slider value={brightness} min={-128} max={128} step={1} valueLabelDisplay="auto"
              onChange={(_, v) => setBrightness(v)} sx={{ mt: -1, mb: 1.2 }} />
      <Typography fontSize={13.5} color="text.secondary" mb={-0.7}>Contrast</Typography>
      <Slider value={contrast}  min={0.1} max={3}   step={0.01} valueLabelDisplay="auto"
              onChange={(_, v) => setContrast(v)}  sx={{ mt: -1 }} />
    </Box>
  );
}

// 样式
const paperStyle = {
  borderRadius: 5, boxShadow: 4, py: 2, bgcolor: '#fff',
  minWidth: imageBoxSize + 40, minHeight: imageBoxSize + 120,
  display: 'flex', flexDirection: 'column', alignItems: 'center'
};
const titleStyle = { fontSize: 20, fontWeight: 500, mb: 1, color: 'text.secondary' };
const canvasStyle = {
  width: imageBoxSize, height: imageBoxSize, borderRadius: 4, bgcolor: '#222',
  my: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
};
const blankBox = { width: '100%', height: '100%', bgcolor: '#222' };
const noTiff   = { position: 'absolute', left: 24, top: 24, color: 'text.secondary' };
const slider   = { width: imageBoxSize - 60, mb: 1 };
const goBtn    = { px: 5, py: 1.5, fontWeight: 700, fontSize: 18, letterSpacing: 2, boxShadow: 5 };

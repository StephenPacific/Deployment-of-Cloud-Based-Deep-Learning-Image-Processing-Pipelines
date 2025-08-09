import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Container, Grid,
  AppBar, Toolbar, Avatar, Paper, Slider, ToggleButton, ToggleButtonGroup, CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Logout from '../pages/Logout.jsx';
import axios from 'axios';

const imageBoxSize = 420;

const axisOptions = [
  { label: 'X', value: 'x' },
  { label: 'Y', value: 'y' },
  { label: 'Z', value: 'z' }
];

export default function Preprocess({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [token] = useState(() => propToken || localStorage.getItem('token') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  const historyId = new URLSearchParams(location.search).get('history_id') || '';

  const [lrH5Path, setLrH5Path] = useState('');
  const [hrH5Path, setHrH5Path] = useState('');

  const [lrAxis, setLrAxis] = useState('z');
  const [lrShape, setLrShape] = useState([1, 1, 1]);
  const [lrSlice, setLrSlice] = useState(0);
  const [lrImg, setLrImg] = useState('');

  const [hrAxis, setHrAxis] = useState('z');
  const [hrShape, setHrShape] = useState([1, 1, 1]);
  const [hrSlice, setHrSlice] = useState(0);
  const [hrImg, setHrImg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    axios.get('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const url = res.data.avatarUrl || '';
      setAvatar(url);
      localStorage.setItem('avatar', url);
    }).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token || !historyId) return;
    (async () => {
      try {
        const res = await axios.get(`/api/preprocess-preview?history_id=${historyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLrH5Path(res.data.lr_h5);
        setHrH5Path(res.data.hr_h5);
      } catch (err) {
        setError('Failed to fetch preprocessed data.');
      }
    })();
  }, [token, historyId]);

  useEffect(() => {
    if (!lrH5Path) return;
    axios.get('/api/h5-meta', {
      params: { h5_path: lrH5Path, history_id: historyId },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setLrShape(res.data.shape || [1, 1, 1]);
      setLrSlice(0);
    }).catch(() => setLrShape([1, 1, 1]));
  }, [lrH5Path, lrAxis, token, historyId]);

  useEffect(() => {
    if (!hrH5Path) return;
    axios.get('/api/h5-meta', {
      params: { h5_path: hrH5Path, history_id: historyId },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setHrShape(res.data.shape || [1, 1, 1]);
      setHrSlice(0);
    }).catch(() => setHrShape([1, 1, 1]));
  }, [hrH5Path, hrAxis, token, historyId]);

  useEffect(() => {
    if (!lrH5Path) return setLrImg('');
    fetchSliceImage(lrH5Path, lrAxis, lrSlice, setLrImg);
    // eslint-disable-next-line
  }, [lrH5Path, lrAxis, lrSlice, token, historyId]);

  useEffect(() => {
    if (!hrH5Path) return setHrImg('');
    fetchSliceImage(hrH5Path, hrAxis, hrSlice, setHrImg);
    // eslint-disable-next-line
  }, [hrH5Path, hrAxis, hrSlice, token, historyId]);

  async function fetchSliceImage(h5Path, axis, sliceIdx, setImg) {
    try {
      const res = await axios.get('/api/h5-slice', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        params: {
          axis,
          index: sliceIdx,
          h5_path: encodeURIComponent(h5Path),
          history_id: historyId
        }
      });
      setImg(URL.createObjectURL(res.data));
    } catch {
      setImg('');
    }
  }

  const runPreprocess = async () => {
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/run_preprocess', { history_id: historyId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const res = await axios.get(`/api/preprocess-preview?history_id=${historyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLrH5Path(res.data.lr_h5);
      setHrH5Path(res.data.hr_h5);
      setLrAxis('z'); setHrAxis('z');
      setLrSlice(0); setHrSlice(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Preprocess failed');
    }
    setLoading(false);
  };

  const handleGoToTrain = () => {
    navigate(`/TrainAndInfer?history_id=${historyId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
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
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
          Preprocessing Result
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {/* Statement for registration function, help user get it clear *** 28 JUL 6:05am */}
          This step performs image registration preprocessing, aligning high-resolution and low-resolution scan volumes for further training and inference.
          (Includes normalization, center slice extraction, threshold-based ROI detection, circle fitting, voxel-space alignment, and 3D cube cropping.)
        </Typography>
        <Grid container spacing={6} justifyContent="center">
          <SliceBox
            title="Low Resolution"
            axis={lrAxis}
            setAxis={setLrAxis}
            shape={lrShape}
            slice={lrSlice}
            setSlice={setLrSlice}
            imgSrc={lrImg}
          />
          <SliceBox
            title="High Resolution"
            axis={hrAxis}
            setAxis={setHrAxis}
            shape={hrShape}
            slice={hrSlice}
            setSlice={setHrSlice}
            imgSrc={hrImg}
          />
        </Grid>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button variant="contained" onClick={runPreprocess} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Run Preprocessing Again'}
          </Button>
          <Button variant="outlined" onClick={handleGoToTrain}>
            Go to Train & Infer
          </Button>
        </Box>
        {error && (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Container>
    </Box>
  );
}

function SliceBox({ title, axis, setAxis, shape, slice, setSlice, imgSrc }) {
  const axisIdx = { x: 0, y: 1, z: 2 }[axis] || 2;
  const numSlices = (shape && shape[axisIdx]) ? shape[axisIdx] : 1;
  return (
    <Grid item xs={12} md={6} lg={5}>
      <Paper sx={paperStyle}>
        <Typography sx={titleStyle}>{title}</Typography>
        <Box sx={canvasStyle}>
          {imgSrc
            ? <img src={imgSrc} alt="slice" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            : <Typography sx={{ color: '#444', position: 'absolute', left: 24, top: 24 }}>No Image</Typography>
          }
        </Box>
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', width: '100%', mt: 1, mb: 1
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1, mt: 1, width: '100%'
          }}>
            <Typography fontWeight={700} sx={{ mr: 1, minWidth: 48 }}>Axis:</Typography>
            <ToggleButtonGroup
              value={axis}
              exclusive
              onChange={(_, v) => v && setAxis(v)}
              size="small"
            >
              {axisOptions.map(opt => (
                <ToggleButton key={opt.value} value={opt.value}>{opt.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', width: '94%', mt: 1
          }}>
            <Typography sx={{ fontWeight: 500, mr: 2, minWidth: 44 }}>Slice</Typography>
            <Slider
              value={slice}
              min={0}
              max={Math.max(0, numSlices - 1)}
              step={1}
              valueLabelDisplay="auto"
              onChange={(_, v) => setSlice(v)}
              sx={{ flex: 1 }}
            />
            <Typography sx={{ ml: 2, minWidth: 54 }}>
              {numSlices === 0 ? '0/0' : `${slice + 1} / ${numSlices}`}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
}

const paperStyle = {
  borderRadius: 5, boxShadow: 4, py: 2, bgcolor: '#fff',
  minWidth: imageBoxSize + 40, minHeight: imageBoxSize + 120,
  display: 'flex', flexDirection: 'column', alignItems: 'center'
};
const titleStyle = { fontSize: 24, fontWeight: 500, mb: 1, color: 'text.secondary' };
const canvasStyle = {
  width: imageBoxSize, height: imageBoxSize, borderRadius: 4, bgcolor: '#222',
  my: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
};

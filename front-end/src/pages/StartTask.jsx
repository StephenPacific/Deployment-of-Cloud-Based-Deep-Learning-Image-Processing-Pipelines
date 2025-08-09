import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, LinearProgress, Grid, Button,
  AppBar, Toolbar, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logout from '../pages/Logout.jsx';
import SparkMD5 from 'spark-md5';


axios.defaults.headers.common.Authorization =
  `Bearer ${localStorage.getItem('token') || ''}`;

const CHUNK_SIZE = 50 * 1024 * 1024; 

export default function StartTask({ token: propToken }) {
  const navigate = useNavigate();

  const [tokenState, setTokenState] = useState(
    propToken || localStorage.getItem('token') || ''
  );
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');

  const [lrFiles, setLrFiles] = useState(null);
  const [hrFiles, setHrFiles] = useState(null);

  const [lrProgress, setLrProgress] = useState(0);
  const [hrProgress, setHrProgress] = useState(0);

  const [lrFolder, setLrFolder] = useState('');
  const [hrFolder, setHrFolder] = useState('');

  /* =============== 鉴权及头像 =============== */
  useEffect(() => {
    if (!tokenState) return navigate('/login');
    axios.defaults.headers.common.Authorization = `Bearer ${tokenState}`;
  }, [tokenState, navigate]);

  useEffect(() => {
    (async () => {
      if (!tokenState) return;
      try {
        const { data } = await axios.get('/api/profile');
        setAvatar(data.avatarUrl || '');
        localStorage.setItem('avatar', data.avatarUrl || '');
      } catch (e) {
        console.error('fetch avatar failed', e);
      }
    })();
  }, [tokenState]);


  const getTopFolder = (files) =>
    files?.[0]?.webkitRelativePath?.split('/')?.[0] || files?.[0]?.name || '';

  const computeMD5 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();
      let current = 0;
      const chunks = Math.ceil(file.size / CHUNK_SIZE);

      reader.onload = (e) => {
        spark.append(e.target.result);
        current++;
        current < chunks ? loadNext() : resolve(spark.end());
      };
      reader.onerror = reject;

      const loadNext = () => {
        const start = current * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        reader.readAsArrayBuffer(file.slice(start, end));
      };
      loadNext();
    });

  const createHistory = async () => {
    const { data } = await axios.post('/api/new-history');
    return data.history_id;
  };

  const uploadFile = async (file, folderType, historyId, setProgress) => {
    const total = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${folderType}-${file.name}-${Date.now()}`;
    const md5 = await computeMD5(file);

    for (let idx = 0; idx < total; idx++) {
      const chunk = file.slice(idx * CHUNK_SIZE, Math.min(file.size, (idx + 1) * CHUNK_SIZE));
      const fd = new FormData();
      fd.append('historyId', historyId);
      fd.append('fileId', fileId);
      fd.append('fileName', file.name);
      fd.append('folderType', folderType);
      fd.append('chunkIndex', String(idx));
      fd.append('chunk', chunk);
      if (idx === total - 1) fd.append('md5', md5);

      await axios.post('/api/upload-chunk', fd);
      setProgress(Math.round(((idx + 1) / total) * 100));
    }

    await axios.post('/api/merge-chunks', {
      historyId,
      fileId,
      fileName: file.name,
      folderType,
      md5
    });
  };

  const uploadAll = async () => {
    try {
      const historyId = await createHistory();
      for (const f of lrFiles) await uploadFile(f, 'lr', historyId, setLrProgress);
      for (const f of hrFiles) await uploadFile(f, 'hr', historyId, setHrProgress);
      alert('Upload finished!');
      navigate(`/preview?history_id=${historyId}`);
    } catch (e) {
      console.error(e);
      alert('Upload failed');
      setLrProgress(0);
      setHrProgress(0);
    }
  };

  const handleLrChange = (e) => {
    setLrFiles(e.target.files);
    setLrFolder(getTopFolder(e.target.files));
    setLrProgress(0);
  };
  const handleHrChange = (e) => {
    setHrFiles(e.target.files);
    setHrFolder(getTopFolder(e.target.files));
    setHrProgress(0);
  };
  const startUpload = () => {
    if (!lrFiles || !hrFiles) return alert('请同时选择 LR 和 HR 文件夹');
    uploadAll();
  };

  /* =============== UI =============== */
  return (
    <Box>
      <AppBar position="static" sx={{ bgcolor: '#333' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', userSelect: 'none' }}>
              Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={avatar || undefined}
              sx={{ cursor: 'pointer', bgcolor: avatar ? 'transparent' : '#eee' }}
              onClick={() => navigate('/profile')}
            />
            {tokenState && <Logout token={tokenState} setToken={setTokenState} />}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 8 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Upload TIFF Folders
        </Typography>

        <Grid container spacing={6} justifyContent="center" sx={{ mt: 6 }}>
          {[
            { title: 'Low Resolution Folder', files: lrFiles, folder: lrFolder, onChange: handleLrChange, progress: lrProgress },
            { title: 'High Resolution Folder', files: hrFiles, folder: hrFolder, onChange: handleHrChange, progress: hrProgress }
          ].map(({ title, folder, onChange, progress }, i) => (
            <Grid item xs={12} md={5} key={i}>
              <Paper elevation={8} sx={{ p: 5, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" gutterBottom>{title}</Typography>
                  <input
                    key={title}                
                    type="file"
                    webkitdirectory="true"
                    directory=""
                    multiple
                    onChange={onChange}
                  />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {folder || 'No folder selected'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Upload Progress</Typography>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="center" gap={4} mt={8}>
          <Button
            variant="contained"
            size="large"
            sx={{ px: 6, py: 1.8, fontSize: '1.2rem' }}
            onClick={startUpload}
            disabled={!lrFiles || !hrFiles}
          >
            UPLOAD FILES
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{ px: 6, py: 1.8, fontSize: '1.2rem', borderWidth: 2 }}
            onClick={() => navigate('/history')}
          >
            View History
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

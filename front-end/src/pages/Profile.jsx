// src/components/Profile.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography,
  Box, TextField, Button, Stack,
  Avatar, IconButton, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText,
  CssBaseline
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Logout from '../pages/Logout.jsx';

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const drawerWidth = 240;

function Profile({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const [token] = useState(() => propToken || localStorage.getItem('token') || '');

  /* -------- 抽屉开关 -------- */
  const [open, setOpen] = useState(false);
  const toggleDrawer = () => setOpen((prev) => !prev);

  /* -------- 表单字段 -------- */
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');

  /* -------- 其它状态 -------- */
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  /* -------- 拉取资料 -------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmail(data.email);
        setUsername(data.username);
        setOrganization(data.organization);
        setAvatarUrl(data.avatarUrl || '');
      } catch (err) {
        console.error(err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token, navigate]);

  /* -------- 校验 -------- */
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!validateEmail(email)) e.email = 'Invalid email';
    if (!username.trim()) e.username = 'Username is required';
    if (!organization.trim()) e.organization = 'Organization is required';
    if (password && password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }
    return e;
  };

  /* -------- 保存 -------- */
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) return setError(e);

    try {
      if (avatarFile) {
        const form = new FormData();
        form.append('avatar', avatarFile);
        form.append('email', email);
        form.append('username', username);
        form.append('organization', organization);
        form.append('password', password);
        await axios.put('/api/profile', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.put(
          '/api/profile',
          { email, username, organization, avatarUrl, password },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setEditMode(false);
      setPassword('');
      setAvatarFile(null);
    } catch (err) {
      setError({ save: err.response?.data?.error || 'Update failed' });
    }
  };

  /* -------- 头像选择 -------- */
  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return <Typography align="center" sx={{ mt: 10 }}>Loading…</Typography>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* —— AppBar —— */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,       // << 把 AppBar 提到 Drawer 之上
          ml: open ? drawerWidth : 0,
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar>
          {/* 抽屉开关按钮 */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>Profile</Typography>
          {token && <Logout token={token} setToken={setToken} />}
        </Toolbar>
      </AppBar>

      {/* —— Persistent Drawer —— */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton onClick={() => navigate('/dashboard')}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/accessibility')}>
            <ListItemIcon><AccessibilityIcon /></ListItemIcon>
            <ListItemText primary="Accessibility" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* —— 主内容区 —— */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: 3,
        ml: open ? `${drawerWidth}px` : 0,
        transition: (theme) => theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        <Toolbar />

        <Box sx={{ width: 400, p: 4, border: '1px solid #ddd', borderRadius: 2, boxShadow: 3, bgcolor: '#fafafa' }}>
          {/* ---------- 只读视图 ---------- */}
          {!editMode && (
            <>
              <Avatar src={avatarUrl} alt={username}
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}>
                {username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom align="center">{username}</Typography>
              <Typography>Email: {email}</Typography>
              <Typography>Organization: {organization}</Typography>

              <Button fullWidth variant="contained" sx={{ mt: 3 }}
                      onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </>
          )}

          {/* ---------- 编辑视图 ---------- */}
          {editMode && (
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar src={avatarUrl}
                        sx={{ width: 120, height: 120, mx: 'auto', mb: 1 }} />
                <input type="file" accept="image/*"
                       ref={fileInputRef} hidden onChange={handleFileChange} />
                <IconButton onClick={handleAvatarClick}><PhotoCameraIcon /></IconButton>
                <TextField label="Avatar URL" fullWidth sx={{ mt: 1 }}
                           value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </Box>

              <TextField label="Email" fullWidth value={email}
                         error={!!error.email} helperText={error.email}
                         onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Username" fullWidth value={username}
                         error={!!error.username} helperText={error.username}
                         onChange={(e) => setUsername(e.target.value)} />
              <TextField label="Organization" fullWidth value={organization}
                         error={!!error.organization} helperText={error.organization}
                         onChange={(e) => setOrganization(e.target.value)} />
              <TextField
                label="New Password (leave blank to keep current)"
                type="password"
                fullWidth
                value={password}
                error={!!error.password}
                helperText={error.password}
                onChange={e => setPassword(e.target.value)}
              />

              {error.save && <Typography color="error">{error.save}</Typography>}

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={handleSave}>Save</Button>
                <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography } from '@mui/material';

function Register({ setTokenFn }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');               // NEW
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // rename => confirmPassword
  const [error, setError] = useState({});
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const register = async (e) => {
    e.preventDefault();
    const newError = {};

    // ----- 前端校验 -----
    if (!email.trim()) newError.email = 'Email is required';
    else if (!validateEmail(email)) newError.email = 'Invalid email format';

    if (!username.trim()) newError.username = 'Username is required';
    if (!organization.trim()) newError.organization = 'Organization is required';

    if (!password.trim()) newError.password = 'Password is required';
    if (!confirmPassword.trim()) newError.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newError.confirmPassword = 'Passwords do not match';

    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    try {
      const res = await axios.post('/api/register', {
        email,
        username,                 
        organization,
        password,
        // 如果你不修改password_confirm 就不删除，如果修改了直接下面改成confirmPassword就行
        password_confirm: confirmPassword,  
      });

      const token = res.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setTokenFn(token);
        navigate('/dashboard');
      } else {
        setError({ register: 'Registration failed. No token received.' });
      }
    } catch (err) {
      setError({ register: err.response?.data?.error || 'Registration failed' });
    }
  };

  return (
    <Box component="form" onSubmit={register}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            maxWidth: 400, mx: 'auto', mt: 8, p: 3,
            border: '1px solid #ddd', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>Create Account</Typography>

      <TextField label="Email" fullWidth margin="normal"
        error={!!error.email} helperText={error.email}
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <TextField label="Username" fullWidth margin="normal"          
        error={!!error.username} helperText={error.username}
        value={username} onChange={(e) => setUsername(e.target.value)} />

      <TextField label="Organization (University / Company)" fullWidth margin="normal"
        error={!!error.organization} helperText={error.organization}
        value={organization} onChange={(e) => setOrganization(e.target.value)} />

      <TextField label="Password" type="password" fullWidth margin="normal"
        error={!!error.password} helperText={error.password}
        value={password} onChange={(e) => setPassword(e.target.value)} />

      <TextField label="Confirm Password" type="password" fullWidth margin="normal"
        error={!!error.confirmPassword} helperText={error.confirmPassword}
        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

      {error.register && (
        <Typography color="error" sx={{ mt: 1 }}>{error.register}</Typography>
      )}

      <Button variant="contained" fullWidth type="submit" sx={{ mt: 2 }}>
        Register
      </Button>

      <Typography variant="body2" sx={{ mt: 2 }}>Already have an account?</Typography>
      <Button variant="outlined" fullWidth onClick={() => navigate('/login')} sx={{ mt: 1 }}>
        Sign In
      </Button>
    </Box>
  );
}

export default Register;

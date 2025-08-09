import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography } from '@mui/material';

// Login component for user authentication
export default function Login({ setTokenFn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState({ email: '', password: '', login: '' });
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    let hasError = false;
    setError({ email: '', password: '', login: '' });

    if (!email.trim()) {
      setError((prev) => ({ ...prev, email: 'Email is required' }));
      hasError = true;
    } else if (!validateEmail(email)) {
      setError((prev) => ({ ...prev, email: 'Enter a valid email' }));
      hasError = true;
    }

    if (!password.trim()) {
      setError((prev) => ({ ...prev, password: 'Password is required' }));
      hasError = true;
    }

    if (hasError) return;

    axios
      .post('/api/login', { email, password })
      .then((response) => {
        const newToken = response.data.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          setTokenFn(newToken);
          navigate('/dashboard');
        } else {
          setError((prev) => ({ ...prev, login: 'Login failed. No token received.' }));
        }
      })
      .catch((error) => {
        console.log(error);
        setError((prev) => ({
          ...prev,
          login: error.response?.data?.error || 'An error occurred',
        }));
      });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        mx: 'auto',
        mt: 8,
        p: 3,
        border: '1px solid #ddd',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Sign In
      </Typography>

      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        margin="normal"
        error={!!error.email}
        helperText={error.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        error={!!error.password}
        helperText={error.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        size="small"
        sx={{ alignSelf: 'flex-start', mt: 1 }}
        onClick={() => navigate('/ForgetPassword')}
      >
        Forget Password
      </Button>

      {error.login && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error.login}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleLogin}
        sx={{ mt: 2, mb: 2 }}
      >
        Next
      </Button>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          my: 2,
          width: '100%',
        }}
      >
        <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'grey.400' }} />
        <Typography variant="body2" color="textSecondary" sx={{ mx: 2 }}>
          Or
        </Typography>
        <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'grey.400' }} />
      </Box>

      <Button variant="outlined" fullWidth onClick={() => navigate('/register')}>
        Create Account
      </Button>
    </Box>
  );
}

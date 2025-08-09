import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography } from '@mui/material';

// Forget Password – two‑step flow: 1) send code 2) verify + set new password
export default function ForgetPassword() {
  // UI step: 'email' -> send code, 'reset' -> enter code & new password
  const [step, setStep] = useState('email');

  // form fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // messages
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const navigate = useNavigate();
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* === Step 1: send reset code === */
  const handleSendCode = async () => {
    setError('');
    setInfo('');

    if (!email.trim()) return setError('Email is required');
    if (!validateEmail(email)) return setError('Enter a valid email');

    try {
      await axios.post('/api/send-reset-code', { email });
      setInfo('Verification code has been sent to your email.');
      setStep('reset');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send code');
    }
  };

  /* === Step 2: verify code & reset password === */
  const handleResetPassword = async () => {
    setError('');
    setInfo('');

    if (!code.trim()) return setError('Verification code is required');
    if (!newPw || !confirmPw) return setError('Password fields cannot be empty');
    if (newPw.length < 6) return setError('Password must be at least 6 characters');
    if (newPw !== confirmPw) return setError('Passwords do not match');

    try {
      await axios.post('/api/verify-reset-code', {
        email,
        code,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      setInfo('Password reset successfully. Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Reset failed');
    }
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
        Forgot Password
      </Typography>

      {step === 'email' && (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter your account email and we’ll send you a verification code.
          </Typography>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error && step === 'email'}
            helperText={step === 'email' ? error : ''}
          />
          {info && (
            <Typography color="success.main" sx={{ mt: 1 }}>
              {info}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSendCode}
          >
            Send Code
          </Button>
        </>
      )}

      {step === 'reset' && (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            We emailed a 6‑digit code to <strong>{email}</strong>. Enter it below with your new password.
          </Typography>
          <TextField
            label="Verification Code"
            fullWidth
            margin="normal"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          {info && (
            <Typography color="success.main" sx={{ mt: 1 }}>
              {info}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>
        </>
      )}

      <Button variant="text" fullWidth sx={{ mt: 2 }} onClick={() => navigate('/login')}>
        Back to Login
      </Button>
    </Box>
  );
}

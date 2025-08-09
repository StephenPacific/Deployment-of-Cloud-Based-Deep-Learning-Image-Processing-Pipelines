import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Avatar, Box, Button, Typography, Paper, LinearProgress, CircularProgress
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Logout from "./Logout.jsx";
import axios from "axios";

function TrainingStage2({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token] = useState(() => propToken || localStorage.getItem("token") || "");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const historyId = new URLSearchParams(location.search).get("history_id") || "";

  const [epoch, setEpoch] = useState(0);
  const [maxEpoch, setMaxEpoch] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  const [previewImage, setPreviewImage] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get("/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data }) => {
      setAvatar(data.avatarUrl || "");
      localStorage.setItem("avatar", data.avatarUrl || "");
    }).catch(err => console.error("fetch avatar error", err));
  }, [token]);

  const startTraining = async () => {
    try {
      setIsRunning(true);
      setIsStopped(false);
      await axios.post("/api/train-stage", {
        history_id: historyId,
        stage: "stage2"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("start training error", err);
    }
  };

  const callControl = async (path) => {
    try {
      await axios.post(path, {
        history_id: historyId,
        stage: "stage2"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(`${path} error`, err);
    }
  };

  useEffect(() => {
    if (!token || !historyId) return;
    startTraining();
  }, [token, historyId]);

  useEffect(() => {
    if (!isRunning) return;
    let timer;

    const fetchProgress = async () => {
      try {
        const { data } = await axios.get("/api/train-progress", {
          params: { history_id: historyId, stage: "stage2" },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.current_epoch != null) setEpoch(data.current_epoch);
        if (data.total_epoch != null) setMaxEpoch(data.total_epoch);

        if (data.current_epoch >= data.total_epoch) {
          setIsRunning(false);
          setIsStopped(true);
          clearInterval(timer);
        }
      } catch (err) {
        console.error("progress polling error", err);
        setIsRunning(false);
      }
    };

    fetchProgress();
    timer = setInterval(fetchProgress, 2500);
    return () => clearInterval(timer);
  }, [isRunning, token, historyId]);

  useEffect(() => {
    if (!isRunning) return;
    const fetchPreview = async () => {
      try {
        const response = await fetch("/api/get-latest-test-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ history_id: historyId, stage: "stage2" })
        });

        const data = await response.json();
        if (response.ok && data.image_base64) {
          setPreviewImage(data.image_base64);
          setPreviewError("");
        } else {
          setPreviewImage("");
          setPreviewError(data.error || "Image not ready");
        }
      } catch {
        setPreviewImage("");
        setPreviewError("Failed to fetch preview image");
      } finally {
        setPreviewLoading(false);
      }
    };

    setPreviewLoading(true);
    fetchPreview();
    const timer = setInterval(fetchPreview, 3000);
    return () => clearInterval(timer);
  }, [isRunning, historyId]);

  const handleStop = async () => {
    await callControl("/api/stop-training");
    setIsRunning(false);
    setIsStopped(true);
  };

  const handleContinue = async () => {
    await callControl("/api/resume-training");
    setIsRunning(true);
    setIsStopped(false);
  };

  const handleNext = () => {
    navigate(`/TrainAndInfer?history_id=${historyId}`);
  };

  return (
    <Box>
      <AppBar position="static" sx={{ bgcolor: "#333" }}>
        <Toolbar>
          <Button onClick={() => navigate("/dashboard")} sx={{ color: "white", fontWeight: "bold", fontSize: "1.2rem" }}>Dashboard</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Avatar alt="User" src={avatar} onClick={() => navigate("/profile")} />
          {token && <Logout token={token} setToken={setToken} />}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" align="center" fontWeight="bold">TrainingStage&nbsp;2</Typography>

        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <Paper elevation={3} sx={{ width: 1300, height: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#000" }}>
            {epoch < 2 ? (
              <Typography color="gray">Generating…</Typography>
            ) : previewLoading ? (
              <CircularProgress />
            ) : previewImage ? (
              <img src={previewImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <Typography color="gray">{previewError}</Typography>
            )}
          </Paper>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", width: 1300, mx: "auto", mb: 4 }}>
          {["LR", "SR", "HR"].map(l => (
            <Typography key={l} variant="subtitle1" fontWeight="bold" color="text.secondary">{l}</Typography>
          ))}
        </Box>

        <Typography variant="body1" gutterBottom>Epoch Progress: {epoch} / {maxEpoch}</Typography>
        <LinearProgress variant="determinate" value={(epoch / maxEpoch) * 100} sx={{ mb: 3 }} />

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Button variant="contained" color="warning" onClick={handleStop} disabled={!isRunning} sx={{ width: 160, height: 50, fontSize: 16 }}>STOP</Button>
            <Button variant="contained" color="primary" onClick={handleContinue} disabled={isRunning || epoch >= maxEpoch} sx={{ width: 160, height: 50, fontSize: 16 }}>CONTINUE</Button>
          </Box>
          <Button variant="contained" color="primary" onClick={handleNext} disabled={!isStopped} sx={{ width: 200, height: 56, fontSize: 18 }}>NEXT</Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TrainingStage2;

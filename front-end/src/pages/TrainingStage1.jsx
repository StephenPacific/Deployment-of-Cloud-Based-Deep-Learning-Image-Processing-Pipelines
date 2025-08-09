import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  CircularProgress
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Logout from "./Logout.jsx";
import axios from "axios";

function TrainingStage1({ token: propToken, setToken }) {
  const [imageUrl, setImageUrl] = useState(null);  // 添加

  const navigate   = useNavigate();
  const location   = useLocation();

  /* -------------------- Auth -------------------- */
  const [token]  = useState(() => propToken || localStorage.getItem("token") || "");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const historyId = new URLSearchParams(location.search).get("history_id") || "";

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAvatar(data.avatarUrl || "");
        localStorage.setItem("avatar", data.avatarUrl || "");
      })
      .catch((err) => console.error("fetch avatar error", err));
  }, [token]);

  /* -------------------- Progress -------------------- */
  const [epoch, setEpoch] = useState(0);
  const [maxEpoch, setMaxEpoch] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  /* -------------------- Preview -------------------- */
  const [previewImage,  setPreviewImage]  = useState("");
  const [previewError,  setPreviewError]  = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

  /* -------------------- helpers -------------------- */
  const startTraining = async () => {
    try {
      setIsRunning(true);
      setIsStopped(false);
      await axios.post(
        "/api/train-stage",
        { history_id: historyId, stage: "stage1" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("/api/train-stage error", err);
    }
  };

  const callControl = async (path) => {
    try {
      await axios.post(
        path,
        { history_id: historyId, stage: "stage1" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(`${path} error`, err);
    }
  };
  /* -------------------- life-cycle -------------------- */
  useEffect(() => {
    if (!token || !historyId) return;
    startTraining();
  }, [token, historyId]);

  /* 轮询训练进度 */
  useEffect(() => {
    if (!isRunning) return;
    let timer;

    const fetchProgress = async () => {
      try {
        const { data } = await axios.get("/api/train-progress", {
          params: { history_id: historyId, stage: "stage1" },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.current_epoch != null) setEpoch(data.current_epoch);
        if (data.total_epoch != null) setMaxEpoch(data.total_epoch);

        if (data.current_epoch >= data.total_epoch) {
          setIsRunning(false);  // 自动停止训练轮询
          setIsStopped(true);
          clearInterval(timer);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          console.error("JWT expired");
          setIsRunning(false);
        } else {
          console.error("progress poll error", err);
        }
      }
    };

    fetchProgress(); // 立即执行一次
    timer = setInterval(fetchProgress, 2500);
    return () => clearInterval(timer);
  }, [isRunning, token, historyId]);

  /* 轮询最新测试图像 */
  useEffect(() => {
    if (!isRunning) return;

    const token = localStorage.getItem("token") || "";
    const historyId = new URLSearchParams(location.search).get("history_id") || "";

    const fetchPreview = async () => {
      try {
        const response = await fetch("/api/get-latest-test-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            history_id: historyId,
            stage: "stage1", // 或使用你传入的变量 stage
          }),
        });

        const data = await response.json();

        if (response.ok && data.image_base64) {
          setPreviewImage(data.image_base64);
          setPreviewError("");
        } else {
          setPreviewImage("");
          setPreviewError(data.error || "Image not available yet");
        }
      } catch (error) {
        setPreviewImage("");
        setPreviewError("Failed to fetch preview image");
      } finally {
        setPreviewLoading(false);
      }
    };

    setPreviewLoading(true);
    fetchPreview(); // 立即执行一次
    const timer = setInterval(fetchPreview, 3000);

    return () => clearInterval(timer);
  }, [isRunning, historyId]);


  /* -------------------- controls -------------------- */
  const handleStop = async () => {
    await callControl("/api/stop-training");
    setIsRunning(false);
    setIsStopped(true);
  };

  const handleContinue = async () => {
    await callControl("/api/resume-training");
    setIsRunning(true);
  };

const handleNext = async () => {
  try {
    const response = await axios.post(
      "/api/inference",
      { history_id: historyId },
      { stage: "stage1"},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status === 200) {
      const confirmed = window.confirm("Stage1 Inference Completed!\nClick OK to continue to Stage2.");
      if (confirmed) {
        navigate(`/TrainingStage2?history_id=${historyId}`);
      }
    } else {
      alert("Inference failed: " + (response.data?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Inference error", err);
    alert("Inference failed.");
  }
};


  /* -------------------- UI -------------------- */
  return (
    <Box>
      {/* ---------- Top AppBar ---------- */}
      <AppBar position="static" sx={{ bgcolor: "#333" }}>
        <Toolbar>
          <Button
            onClick={() => navigate("/dashboard")}
            sx={{
              color: "white",
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1.2rem"
            }}
          >
            Dashboard
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              alt="User Avatar"
              src={avatar || undefined}
              sx={{ cursor: "pointer", bgcolor: avatar ? "transparent" : "#eee" }}
              onClick={() => navigate("/profile")}
            />
            {token && <Logout token={token} setToken={setToken} />}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ---------- Body ---------- */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
          TrainingStage&nbsp;1
        </Typography>

        {/* ------ Preview ------ */}
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <Paper
            elevation={3}
            sx={{
              width: 1300,
              maxWidth: "100%",
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              bgcolor: "#000"
            }}
          >
            {epoch < 2 ? (
              <Typography color="gray">Generating…</Typography>
            ) : previewLoading ? (
              <CircularProgress />
            ) : previewImage ? (
              <img
                src={previewImage}
                alt="SR preview"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography color="gray">{previewError}</Typography>
            )}
          </Paper>
        </Box>

        {/* LR / SR / HR labels */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: 1300,
            maxWidth: "100%",
            mx: "auto",
            mb: 4
          }}
        >
          {["LR", "SR", "HR"].map((l) => (
            <Typography key={l} variant="subtitle1" fontWeight="bold" color="text.secondary">
              {l}
            </Typography>
          ))}
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Epoch Progress: {epoch} / {maxEpoch}
          </Typography>
          <LinearProgress variant="determinate" value={(epoch / maxEpoch) * 100} />
        </Box>

        {/* Control buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Button
              variant="contained"
              color="warning"
              sx={{ width: 160, height: 50, fontSize: 16 }}
              onClick={handleStop}
              disabled={!isRunning}
            >
              STOP
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ width: 160, height: 50, fontSize: 16 }}
              onClick={handleContinue}
              disabled={isRunning || epoch >= maxEpoch}
            >
              CONTINUE
            </Button>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ width: 200, height: 56, fontSize: 18 }}
            onClick={handleNext}
            disabled={!isStopped}
          >
            NEXT
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TrainingStage1;

// src/pages/TrainingOptions.jsx


import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Logout from "./Logout.jsx";
import axios from "axios";

function TrainingOptions({ token: propToken, setToken }) {
  const navigate = useNavigate();
  const location = useLocation();

  /* -------------------- Auth & avatar -------------------- */
  const [token] = useState(() => propToken || localStorage.getItem("token") || "");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const historyId = new URLSearchParams(location.search).get("history_id") || "";

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const { data } = await axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } });
        setAvatar(data.avatarUrl || "");
        localStorage.setItem("avatar", data.avatarUrl || "");
      } catch (err) {
        console.error("Failed to fetch avatar", err);
      }
    };
    if (token) fetchAvatar();
  }, [token]);

  /* -------------------- State -------------------- */
  const empty = { option1: "", option2: "", option3: "", option4: "" };
  const defaultsStage2 = { option1: "def1", option2: "def2", option3: "B", option4: "Y" }; // 可按需要调整默认值

  const [stage1, setStage1] = useState(empty);
  const [stage2, setStage2] = useState(defaultsStage2);
  const [trainAll, setTrainAll] = useState(false); // false = 默认值且不可编辑

  const changeStage = (setter) => (field) => (e) => {
    setter((prev) => ({ ...prev, [field]: e.target.value }));
  };

  /* -------------------- Submit -------------------- */
  const handleGo = async () => {
    try {
      // TODO: replace with real endpoint
      /*
      await axios.post(
        "/api/train/options",
        { stage1, stage2, trainAll, historyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      */
      const target = historyId ? `/TrainingStage1?history_id=${historyId}` : "/TrainingStage1";
      navigate(target);
    } catch (err) {
      console.error("Failed to submit training options", err);
    }
  };

  /* -------------------- Reusable field component -------------------- */
  const renderFields = (data, onChange, disabled) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Option 1"
        variant="outlined"
        value={data.option1}
        onChange={onChange("option1")}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Option 2"
        variant="outlined"
        value={data.option2}
        onChange={onChange("option2")}
        fullWidth
        disabled={disabled}
      />
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="opt3">Option 3</InputLabel>
        <Select labelId="opt3" label="Option 3" value={data.option3} onChange={onChange("option3")}>
          {['A', 'B', 'C'].map((v) => (
            <MenuItem key={v} value={v}>{v}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="opt4">Option 4</InputLabel>
        <Select labelId="opt4" label="Option 4" value={data.option4} onChange={onChange("option4")}>
          {['X', 'Y', 'Z'].map((v) => (
            <MenuItem key={v} value={v}>{v}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  /* -------------------------- UI ------------------------- */
  return (
    <Box>
      <AppBar position="static" sx={{ bgcolor: "#333" }}>
        <Toolbar>
          <Button onClick={() => navigate("/dashboard")} sx={{ color: "white", fontWeight: "bold", textTransform: "none", fontSize: "1.2rem" }}>
            Dashboard
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar alt="User Avatar" src={avatar || undefined} sx={{ cursor: "pointer", bgcolor: avatar ? "transparent" : "#eee" }} onClick={() => navigate("/profile")} />
            {token && <Logout token={token} setToken={setToken} />}
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: "calc(100vh - 64px)", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#f5f7fa", p: 2 }}>
        <Paper elevation={4} sx={{ p: 6, borderRadius: 4, width: 1100, maxWidth: "95%" }}>
          <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
            Options
          </Typography>

          {/* Two‑column options */}
          <Box sx={{ display: "flex", gap: 6, mt: 4, flexWrap: "wrap" }}>
            {/* Stage1 column */}
            <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>Stage 1</Typography>
              {renderFields(stage1, changeStage(setStage1), false)}
            </Box>

            {/* Stage2 column */}
            <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>Stage 2</Typography>
              {renderFields(stage2, changeStage(setStage2), !trainAll)}

              <FormControlLabel
                sx={{ mt: 2 }}
                control={<Checkbox checked={trainAll} onChange={(e) => setTrainAll(e.target.checked)} />}
                label="Train all"
              />
            </Box>
          </Box>

          {/* GO */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <Button variant="contained" color="primary" size="large" onClick={handleGo}>
              GO
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default TrainingOptions;

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
// import { BalanceOutlined, BalconyOutlined } from "@mui/icons-material";

const API_BASE = "/admin_api";
// const API_BASE = "http://127.0.0.1:5005/admin_api";
// const API_BASE = "https://ec373ec8e594.ngrok-free.app/admin_api";

const AdminPanel = () => {
  // Admin panel state / State variables
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    userId: null,
  });
  const [selectedUsers, setSelectedUsers] = useState([]); // Multi-select users

  // Fetch user list
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data);
    } catch (err) {
      showSnackbar("Unable to fetch user data", "error");
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/users/${id}`);
      showSnackbar("User deleted", "success");
      fetchUsers();
    } catch {
      showSnackbar("Deletion failed", "error");
    }
  };

  // Confirm deletion
  const performDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/users/${id}`);
      showSnackbar("User deleted", "success");
      fetchUsers();
    } catch {
      showSnackbar("Deletion failed", "error");
    }
  };

  // Ban user
  const handleBan = async (id) => {
    try {
      await axios.put(`${API_BASE}/users/${id}`, { banned: true });
      showSnackbar("User banned", "info");
      fetchUsers();
    } catch {
      showSnackbar("Ban failed", "error");
    }
  };

  // Confirm ban
  const performBan = async (id) => {
    try {
      await axios.put(`${API_BASE}/users/${id}`, { banned: true });
      showSnackbar("User banned", "info");
      fetchUsers();
    } catch {
      showSnackbar("Ban failed", "error");
    }
  };

  // Unban user
  const handleUnban = async (id) => {
    try {
      await axios.put(`${API_BASE}/users/${id}`, { banned: false });
      showSnackbar("User unbanned", "success");
      fetchUsers();
    } catch {
      showSnackbar("Unban failed", "error");
    }
  };

  // Confirm unban
  const performUnban = async (id) => {
    try {
      await axios.put(`${API_BASE}/users/${id}`, { banned: false });
      showSnackbar("User unbanned", "success");
      fetchUsers();
    } catch {
      showSnackbar("Unban failed", "error");
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
      setOpenDialog(true);
    } catch (err) {
      showSnackbar("Unable to fetch history", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // 添加log，取消勾选时 selectedUsers 变为 []，并验证按钮应变为 disabled={true}。
  useEffect(() => {
    fetchUsers();
    console.log("Selected Users are: ", selectedUsers); 
    console.log("#Users Selected so far: ", selectedUsers.length);},
    [selectedUsers]);
    

  const userColumns = [
    { field: "_id", headerName: "ID", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "organization", headerName: "Organization", flex: 1 },
    { 
      field: "banned", 
      headerName: "Banned", 
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: params.value ? 'red' : 'green' }}>
          {params.value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      renderCell: (params) => (
        <Box>
          <Button
            color="error"
            size="small"
            variant="outlined"
            onClick={() => setConfirmDialog({ open: true, action: "delete", userId: params.row._id })}
          >
            Delete
          </Button>
          {!params.row.banned && (
            <Button
              color="warning"
              size="small"
              variant="outlined"
              onClick={() => setConfirmDialog({ open: true, action: "ban", userId: params.row._id })}
              sx={{ ml: 1 }}
            >
              Ban
            </Button>
          )}
          {params.row.banned && (
            <Button
              color="success"
              size="small"
              variant="outlined"
              onClick={() => setConfirmDialog({ open: true, action: "unban", userId: params.row._id })}
              sx={{ ml: 1 }}
            >
              Unban
            </Button>
          )}
        </Box>
      ),
    },
  ];

  const historyColumns = [
    { field: "_id", headerName: "Record ID", flex: 1 },
    { field: "user_id", headerName: "User ID", flex: 1 },
    { field: "user_name", headerName: "Username", flex: 1 },
    { field: "text", headerName: "Content", flex: 2 },
    { field: "banned", headerName: "Ban Status", flex: 1 },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="error"
          disabled={selectedUsers.length === 0}
          onClick={() =>
            setConfirmDialog({ open: true, action: "bulk-delete", userId: selectedUsers })
          }
          sx={{ mr: 1 }}
        >
          Bulk Delete
        </Button>
        <Button
          variant="outlined"
          color="warning"
          disabled={selectedUsers.length === 0}
          onClick={() =>
            setConfirmDialog({ open: true, action: "bulk-ban", userId: selectedUsers })
          }
        >
          Bulk Ban
        </Button>
      </Box>
      
      
      <Box sx={{ height: 400, my: 2 }}>
        
        <DataGrid
          rows={users}
          columns={userColumns}
          getRowId={(row) => row._id}
          checkboxSelection
          // debug: 取消勾选时批量按钮会变灰色
          // debug: selectionModel 是 mui官方的命名，不能自己改成其他的名字
          onRowSelectionModelChange={(selectionModel) => {
            const selected = Array.isArray(selectionModel)
            ? selectionModel
            : Array.from(selectionModel?.ids ?? []);
            // const selected = selectionModel;
            setSelectedUsers(selected);
            console.log("selectedUsers:", selected);
          }}
          // rowSelectionModel={selected || []}
          pageSize={5}
          />

        {/* <DataGrid
          rows={users}
          columns={userColumns}
          getRowId={(row) => row._id}
          checkboxSelection
          rowSelectionModel={selectedUsers || []}
          onRowSelectionModelChange={(newSelection) => {
            const safeSelection = Array.isArray(newSelection) ? newSelection : [];
            setSelectedUsers(safeSelection);
            console.log("selectedUsers:", safeSelection);
          }}
          pageSize={5}
        /> */}


        {/* <DataGrid
          rows={users}
          columns={userColumns}
          getRowId={(row) => row._id}
          checkboxSelection
          // rowSelectionModel={selectedUsers || []} //不能用；否则页面空白
          onRowSelectionModelChange={(selectionModel) => {
            const safeSelection = Array.isArray(selectionModel) 
              ? selectionModel 
              : Array.from(selectionModel?.ids ?? []);
              setSelectedUsers(safeSelection);
              // setSelectedUsers(selected);
            console.log("selectedUsers:", safeSelection);
          }}
          pageSize={5}
        /> */}

        
      </Box>

      <Button variant="contained" onClick={fetchHistory}>
        View History
      </Button>

      {/* History dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>History</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={history}
              columns={historyColumns}
              getRowId={(row) => row._id}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to
            {confirmDialog.action === "delete" && " delete this user?"}
            {confirmDialog.action === "ban" && " ban this user?"}
            {confirmDialog.action === "unban" && " unban this user?"}
            {confirmDialog.action === "bulk-delete" && " delete these users?"}
            {confirmDialog.action === "bulk-ban" && " ban these users?"}
            {confirmDialog.action === "bulk-unban" && " unban these users?"}
          </Typography>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={
                confirmDialog.action?.includes("delete") ? "error" : "warning"
              }
              onClick={async () => {
                const ids = confirmDialog.userId;

                if (confirmDialog.action === "delete") {
                  await performDelete(ids);
                } else if (confirmDialog.action === "ban") {
                  await performBan(ids);
                } else if (confirmDialog.action === "unban") {
                  await performUnban(ids);
                } else if (confirmDialog.action === "bulk-delete") {
                  for (const id of ids) await performDelete(id);
                } else if (confirmDialog.action === "bulk-ban") {
                  for (const id of ids) await performBan(id);
                } else if (confirmDialog.action === "bulk-unban") {
                  for (const id of ids) await performUnban(id);
                }

                setConfirmDialog({ open: false, action: null, userId: null });
                setSelectedUsers([]); // Clear selection
              }}
            >
              Confirm
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;
import React, { useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, Link,useNavigate } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
// import Logout from './component1/Logout.jsx';

const Dashboard = function () {
  return <>dashboard</>
}

function App() {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('token') !== null) {
      setToken(localStorage.getItem('token'));
      console.log('token found',token);
    }
  }, []);

  const handleNewToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    navigate('/dashboard');
  }

  return (
    <BrowserRouter>
      <div>
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            &nbsp;|&nbsp;
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            &nbsp;|&nbsp;
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register token={token} handleSuccess = {handleNewToken} />} />
        <Route path="/login" element={<Login token={token} handleSuccess={handleNewToken} />} />
        <Route path="/admin" element={<AdminPanel />} /> {/* Add Admin route */}
      </Routes>
      {token && (
        <>
          <hr />
          <Logout token={token} setToken={setToken} />
        </>
      )}
    </BrowserRouter>
  )
}

export default App;

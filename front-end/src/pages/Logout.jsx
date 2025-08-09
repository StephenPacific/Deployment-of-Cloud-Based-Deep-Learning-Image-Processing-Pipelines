import axios from "axios";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Logout component to handle user logout and token removal
const Logout = ({ token, setToken }) => {
  const navigate = useNavigate();

  // Function to handle the logout process
  const logout = () => {
    console.log({ headers: { Authorization: `Bearer ${token}` } });

    // Send a POST request to the logout endpoint with the authorization header
    axios
      .post(
        '/api/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        // Remove token from localStorage, update state, and redirect to login
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login');
        console.log(response);
      })
      .catch((error) => {
        // Log and display error if logout fails
        console.log(error);
      });
  };

  return (
    // Logout button with custom styling and click handler
    <Button
      onClick={logout}
      variant="text"
      sx={{
        color: '#cc99ff',
        fontSize: { xs: '1rem', sm: '1.2rem' },
        fontWeight: 'bold',
      }}
    >
      Logout
    </Button>
  );
};

export default Logout;

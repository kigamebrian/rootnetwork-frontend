// frontend/src/pages/SetupRoute.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config'; // Import the environment-based API URL

function SetupRoute({ setShowRegister, isLoggedIn, adminData }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAndRedirect();
  }, []);

  const checkAndRedirect = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/check-registration-status`, {
        withCredentials: true
      });
      
      // If users already exist, registration is closed
      if (!response.data.registration_open) {
        if (isLoggedIn && adminData?.is_super_admin) {
          // Already logged in as admin - go to admin panel
          navigate('/admin');
        } else if (isLoggedIn) {
          // Logged in but not super admin - go to home
          navigate('/');
        } else {
          // Not logged in - go to login
          navigate('/login');
        }
      } else {
        // No users exist - show registration modal for first-time setup
        setShowRegister(true);
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
      navigate('/');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return null;
}

export default SetupRoute;

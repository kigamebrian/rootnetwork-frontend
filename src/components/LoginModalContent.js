// frontend/src/components/LoginModalContent.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginModalContent({ loginCreds, setLoginCreds, handleLogin, onClose }) {
  const [checking, setChecking] = useState(true);
  const [canShowLogin, setCanShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-registration-status', {
        withCredentials: true
      });
      
      if (response.data.registration_open) {
        navigate('/setup', { replace: true });
      } else {
        setCanShowLogin(true);
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
      setCanShowLogin(true);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Checking database...</span>
            </div>
            <p className="mt-3 mb-0">Checking registration status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canShowLogin) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Writer Login</h2>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        <p className="text-muted small mb-3">
          <i className="fas fa-lock me-1"></i>
          Access your writer dashboard
        </p>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin(loginCreds, onClose);
        }}>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Email or Username"
            value={loginCreds.identifier}
            onChange={(e) => setLoginCreds({...loginCreds, identifier: e.target.value})}
            required
            autoFocus
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={loginCreds.password}
            onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
            required
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1">
              <i className="fas fa-sign-in-alt me-2"></i>
              Login
            </button>
            <button type="button" className="btn btn-secondary flex-grow-1" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        <hr className="my-3" />
        <div className="text-center">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            This area is for writers and administrators only.
          </small>
        </div>
      </div>
    </div>
  );
}

export default LoginModalContent;
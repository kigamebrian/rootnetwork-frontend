// frontend/src/components/LoginModal.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginModal({ showLogin, setShowLogin, loginCreds, setLoginCreds, handleLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state?.background;

  if (!showLogin) return null;

  const handleClose = () => {
    setShowLogin(false);
    // Navigate back to the background page if it exists
    if (background) {
      navigate(background.pathname);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Writer Login</h2>
          <button 
            type="button" 
            className="btn-close" 
            onClick={handleClose}
            aria-label="Close"
          ></button>
        </div>
        <p className="text-muted small mb-3">
          <i className="fas fa-lock me-1"></i>
          Access your writer dashboard
        </p>
        <form onSubmit={handleLogin}>
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
            <button type="button" className="btn btn-secondary flex-grow-1" onClick={handleClose}>
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

export default LoginModal;
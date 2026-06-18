// frontend/src/pages/VerifySubscription.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';   // <-- import config

function VerifySubscription() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    if (hasVerified.current) return;

    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/subscribe/verify/${token}`,
          { withCredentials: true }
        );
        hasVerified.current = true;
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');

        // Clean URL – remove token
        window.history.replaceState({}, document.title, '/subscribe/verified');
      } catch (error) {
        hasVerified.current = true;
        setStatus('error');
        const errMsg = error.response?.data?.error || 'Verification failed. Please try again.';
        setMessage(errMsg);
      }
    };

    verifyEmail();
  }, [token]);

  // --- Loading ---
  if (status === 'loading') {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: '#07255b' }} role="status">
          <span className="visually-hidden">Verifying...</span>
        </div>
        <p className="mt-3">Verifying your email address...</p>
      </div>
    );
  }

  // --- Success ---
  if (status === 'success') {
    return (
      <div className="container py-5">
        <style>{`
          .btn-theme {
            background-color: #07255b;
            border-color: #07255b;
            color: white;
          }
          .btn-theme:hover {
            background-color: #0a3a8a;
            border-color: #0a3a8a;
            color: white;
          }
          .btn-outline-theme {
            color: #07255b;
            border-color: #07255b;
          }
          .btn-outline-theme:hover {
            background-color: #07255b;
            border-color: #07255b;
            color: white;
          }
          .card-shadow {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
          }
        `}</style>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 text-center">
            <div className="card shadow-sm border-0 p-4">
              <div className="display-1 text-success mb-3">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="fw-bold mb-3" style={{ color: '#07255b' }}>You're all set!</h3>
              <p className="text-muted">{message}</p>
              <p className="text-muted small">
                You'll now receive updates based on your preferences.
              </p>
              <Link to="/" className="btn btn-theme mt-3">
                <i className="fas fa-home me-2"></i> Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error ---
  return (
    <div className="container py-5">
      <style>{`
        .btn-theme {
          background-color: #07255b;
          border-color: #07255b;
          color: white;
        }
        .btn-theme:hover {
          background-color: #0a3a8a;
          border-color: #0a3a8a;
          color: white;
        }
        .btn-outline-theme {
          color: #07255b;
          border-color: #07255b;
        }
        .btn-outline-theme:hover {
          background-color: #07255b;
          border-color: #07255b;
          color: white;
        }
      `}</style>
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5 text-center">
          <div className="card shadow-sm border-0 p-4">
            <div className="display-1 text-danger mb-3">
              <i className="fas fa-times-circle"></i>
            </div>
            <h3 className="fw-bold mb-3" style={{ color: '#07255b' }}>Verification failed</h3>
            <p className="text-muted">{message}</p>
            <p className="text-muted small">
              The link may have expired or is invalid.
            </p>
            <Link to="/" className="btn btn-outline-theme mt-3">
              <i className="fas fa-home me-2"></i> Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifySubscription;

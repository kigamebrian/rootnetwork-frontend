// frontend/src/components/RegisterModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function RegisterModal({ showRegister, setShowRegister, onRegisterSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirm_password: '',
    blog_title: 'My Blog',
    blog_subtitle: 'Welcome to my blog'
  });
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    if (showRegister) {
      checkRegistrationStatus();
    }
  }, [showRegister]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-registration-status');
      setRegistrationOpen(response.data.registration_open);
      if (!response.data.registration_open) {
        toast.error('Registration is closed. Only admin can add users.');
        setTimeout(() => {
          setShowRegister(false);
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to check registration status', error);
    }
  };

  const handleClose = () => {
    setShowRegister(false);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        password: formData.password,
        blog_title: formData.blog_title,
        blog_subtitle: formData.blog_subtitle
      });
      
      toast.success(response.data.message);
      setShowRegister(false);
      onRegisterSuccess(response.data.user);
      navigate('/admin');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!showRegister) return null;

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{ 
        width: '500px', 
        maxWidth: '100%',
        maxHeight: '90vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Fixed Header */}
        <div style={{ 
          padding: '20px 20px 0 20px',
          borderBottom: '1px solid #e9ecef',
          flexShrink: 0
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>
              {registrationOpen ? 'Create Admin Account' : 'Registration Closed'}
            </h2>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          {registrationOpen && (
            <p className="text-muted small mt-2 mb-0">
              <i className="fas fa-cog me-1"></i>
              First-time setup - create your super admin account
            </p>
          )}
        </div>
        
        {/* Scrollable Body */}
        <div style={{ 
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {registrationOpen ? (
            <form onSubmit={handleSubmit} id="registerForm">
              <div className="mb-3">
                <label className="form-label">Email</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-user"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Full Name (Optional)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-user-circle"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your full name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-key"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-check-circle"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Blog Title (Optional)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-tag"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="My Awesome Blog"
                    value={formData.blog_title}
                    onChange={(e) => setFormData({...formData, blog_title: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Blog Subtitle (Optional)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-quote-right"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Welcome to my blog"
                    value={formData.blog_subtitle}
                    onChange={(e) => setFormData({...formData, blog_subtitle: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="alert alert-info small mt-2">
                <i className="fas fa-info-circle me-1"></i>
                You are registering as the <strong>first user</strong>. You will become the <strong>Super Admin</strong> with full control.
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Registration is closed. Only the Super Admin can add new users.
              </div>
            </div>
          )}
        </div>
        
        {/* Fixed Footer with Buttons */}
        {registrationOpen && (
          <div style={{ 
            padding: '15px 20px',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
            backgroundColor: 'white'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary flex-grow-1" 
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="registerForm" 
              className="btn btn-primary flex-grow-1" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Register
                </>
              )}
            </button>
          </div>
        )}
        
        {!registrationOpen && (
          <div style={{ 
            padding: '15px 20px',
            borderTop: '1px solid #e9ecef',
            flexShrink: 0
          }}>
            <button className="btn btn-secondary w-100" onClick={handleClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterModal;
// frontend/src/components/Footer.js
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function Footer({ isLoggedIn, adminData, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login', { state: { backgroundLocation: location } });
  };

  return (
    <footer className="footer py-4 mt-auto">
      <div className="container">
        {/* Single Row with 3 columns: Socials | Copyright | Login */}
        <div className="row align-items-center">
          {/* Left: Social Links */}
          <div className="col-md-4 text-center text-md-start mb-3 mb-md-0">
            <div className="social-links">
              <a href="#" className="text-muted me-3" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted me-3" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-muted me-3" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-muted me-3" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" className="text-muted" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          {/* Center: Copyright */}
          <div className="col-md-4 text-center mb-3 mb-md-0">
            <span className="text-muted small">
              © {new Date().getFullYear()} RootNetwork. All rights reserved.
            </span>
          </div>
          
          {/* Right: Login/Logout */}
          <div className="col-md-4 text-center text-md-end">
            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="btn btn-link text-muted p-0 small"
                style={{ fontSize: '11px', opacity: 0.4, textDecoration: 'none' }}
              >
                <i className="fas fa-sign-out-alt me-1"></i> logout
              </button>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="btn btn-link text-muted p-0 small"
                style={{ fontSize: '11px', opacity: 0.4, textDecoration: 'none' }}
              >
                <i className="fas fa-key me-1"></i> login
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }
        
        .social-links a {
          transition: all 0.3s ease;
          font-size: 18px;
        }
        
        .social-links a:hover {
          color: #2D9CDB !important;
          transform: translateY(-2px);
        }
        
        .btn-link:hover {
          opacity: 0.7 !important;
        }
        
        @media (max-width: 768px) {
          .social-links a {
            font-size: 16px;
          }
          
          .social-links {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
// frontend/src/components/Footer.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config'; // <-- ADDED

function Footer({ isLoggedIn, adminData, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navCategories, setNavCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchNavCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/nav-categories`, {
          withCredentials: true
        });
        setNavCategories(response.data);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Failed to fetch nav categories:', error);
        setLoadingCategories(false);
      }
    };
    fetchNavCategories();
  }, []);

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login', { state: { backgroundLocation: location } });
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Main footer content - 4 columns */}
        <div className="row justify-content-lg-between">
          <div className="col-lg-3 col-md-6">
            <div className="footer-info">
              <Link to="/">
                <img src="/RootNetwork-logo.svg" alt="RootNetwork" style={{ height: '40px', width: 'auto' }} />
              </Link>
              <p style={{ marginTop: '16px', color: '#6c757d' }}>
                  Amplifying voices, inspiring conversations, 
                  and empowering communities through stories that matter
              </p>
            </div>
          </div>

          <div className="col-lg-1 col-md-2">
            <div className="footer-wizard">
              <h6>Category</h6>
              {!loadingCategories ? (
                <ul className="list-unstyled">
                  {navCategories.map((category) => (
                    <li key={category.id}>
                      <Link to={`/category/${category.slug}`}>{category.name}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '14px', color: '#6c757d' }}>Loading...</p>
              )}
            </div>
          </div>

          <div className="col-lg-2 offset-lg-1 col-md-3">
            <div className="footer-wizard">
              <h6>Follow us</h6>
              <ul className="list-unstyled">
                <li><a href="#">Facebook</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Youtube</a></li>
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="footer-wizard">
              <h6>Newsletter</h6>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="footer-wizard-form d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                  <input type="email" placeholder="Enter Email" className="form-control mb-2 mb-sm-0" />
                  <button className="btn btn-default btn-default-sm">Subscribe</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright Row */}
        <div className="copy-right">
          <p>© {new Date().getFullYear()} RootNetwork. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <span className="footer-link-divider">|</span>
            <Link to="/contact">Contact Us</Link>
            <span className="footer-link-divider">|</span>
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-link-divider">|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <div className="footer-auth">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn btn-link text-muted p-0">
                <i className="fas fa-sign-out-alt me-1"></i> logout
              </button>
            ) : (
              <button onClick={handleLoginClick} className="btn btn-link text-muted p-0">
                <i className="fas fa-key me-1"></i> login
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background: #ffffff;
          padding-top: 100px;
          border-top: 1px solid #e9ecef;
        }
        .footer .footer-wizard h6 {
          font-weight: 400;
          font-size: 24px;
          margin-bottom: 20px;
          color: #272343;
        }
        .footer .footer-wizard a {
          margin-bottom: 10px;
          display: block;
          font-weight: 400;
          font-size: 16px;
          color: #6c757d;
          transition: 0.3s all linear;
          text-decoration: none;
        }
        .footer .footer-wizard a:hover {
          color: #07255b !important;
        }
        .footer .footer-wizard-form input:focus {
          border-color: #07255b;
          outline: none;
          box-shadow: 0 0 0 0.2rem rgba(7, 37, 91, 0.25);
        }
        .btn-default {
          height: 50px;
          padding: 0 22px;
          background-color: #07255b;
          color: white;
          border-radius: 0;
          font-weight: 500;
          font-size: 16px;
          border: none;
          transition: 0.3s all linear;
        }
        .btn-default:hover {
          background-color: #07255b;
          color: white;
        }
        .copy-right {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #e9ecef;
          margin-top: 70px;
          padding: 20px 0px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .copy-right p {
          margin-bottom: 0;
          color: #6c757d;
          font-size: 14px;
        }
        .footer-links {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }
        .footer-links a {
          color: #6c757d;
          text-decoration: none;
          font-size: 14px;
          transition: 0.3s all linear;
        }
        .footer-links a:hover {
          color: #07255b !important;
        }
        .footer-link-divider {
          color: #dee2e6;
          font-size: 14px;
        }
        .footer-auth .btn-link {
          font-size: 14px;
          color: #6c757d;
          text-decoration: none;
        }
        .footer-auth .btn-link:hover {
          color: #07255b !important;
        }
        @media (max-width: 991px) {
          .footer {
            padding-top: 50px;
          }
          .footer .footer-wizard {
            margin-bottom: 30px;
          }
          .footer .footer-wizard-form {
            flex-direction: column;
            align-items: stretch !important;
          }
          .footer .footer-wizard-form input {
            margin-right: 0 !important;
            margin-bottom: 10px;
          }
          .copy-right {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          .footer-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;

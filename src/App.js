// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RegisterModal from './components/RegisterModal';
import LoginModalContent from './components/LoginModalContent';

// Pages
import HomePage from './pages/HomePage';
import BlogPage from './components/BlogPage';
import AboutPage from './pages/AboutPage';
import AdminPanel from './components/AdminPanel';
import PostDetail from './components/PostDetail';
import EditPost from './components/EditPost';
import AnalyticsPage from './components/AnalyticsPage';
import SecurityDashboard from './components/SecurityDashboard';
import Profile from './components/Profile';
import SetupRoute from './pages/SetupRoute';

// Hooks & Utils
import { useAuth } from './hooks/useAuth';
import tracking from './utils/tracking';

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;


function AppContent() {
  const { isLoggedIn, adminData, loading, handleLogin, handleLogout, fetchAdminData } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ identifier: '', password: '' });
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const backgroundLocation = location.state?.backgroundLocation;
  const isHomePage = location.pathname === '/';

  // Initial check for zero users
  useEffect(() => {
    const checkInitialUserStatus = async () => {
      try {
        const response = await axios.get('/api/check-registration-status');
        if (response.data.registration_open && location.pathname !== '/setup') {
          navigate('/setup');
        }
      } catch (error) {
        console.error('Failed to check user status:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    checkInitialUserStatus();
  }, []);

  // Track page views
  useEffect(() => {
    const trackCurrentPage = async () => {
      const path = location.pathname;
      let pageType = 'other';
      if (path === '/') pageType = 'home';
      else if (path === '/blog') pageType = 'blog';
      else if (path.startsWith('/blog/post/')) pageType = 'post';
      else if (path.startsWith('/category/')) pageType = 'category';
      else if (path === '/about') pageType = 'about';
      else if (path.startsWith('/admin')) pageType = 'admin';
      await tracking.trackPageView(pageType, null);
    };
    trackCurrentPage();
  }, [location]);

  const handleRegisterSuccess = (userData) => {
    fetchAdminData();
  };

  const onLoginSuccess = () => {
    setLoginCreds({ identifier: '', password: '' });
    navigate(-1); // Close modal and go back
  };

  if (loading || !initialCheckDone) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isHomePage ? "homepage-container": "app-container"}>
      <Toaster position="top-right" />
      
      {isHomePage && (
        <div className="fullscreen-bg" style={{ backgroundImage: `url(${API_URL}0/static/index.jpg)` }}></div>
      )}

      <div className="d-flex flex-column min-vh-100">
        <Navbar 
          isLoggedIn={isLoggedIn}
          adminData={adminData}
          setShowRegister={setShowRegister}
          handleLogout={handleLogout}
        />

        <main className="container" style={{ paddingBottom: '20px', paddingTop: '40px' }}>
          {/* Main Routes with background support */}
          <Routes location={backgroundLocation || location}>
            <Route path="/" element={<HomePage adminData={adminData} />} />
            <Route path="/blog" element={<BlogPage isLoggedIn={isLoggedIn} />} />
            <Route path="/category/:categorySlug" element={<BlogPage isLoggedIn={isLoggedIn} />} />
            <Route path="/blog/post/:slug" element={<PostDetail isLoggedIn={isLoggedIn} adminData={adminData} currentUserId={adminData?.id} isSuperAdmin={adminData?.is_super_admin} />} />
            <Route path="/about" element={<AboutPage adminData={adminData} />} />
            <Route path="/setup" element={<SetupRoute setShowRegister={setShowRegister} isLoggedIn={isLoggedIn} adminData={adminData} />} />
            <Route path="/admin/edit/:slug" element={<EditPost isLoggedIn={isLoggedIn} currentUserId={adminData?.id} isSuperAdmin={adminData?.is_super_admin} />} />
            <Route path="/admin/create" element={<EditPost isLoggedIn={isLoggedIn} currentUserId={adminData?.id} isSuperAdmin={adminData?.is_super_admin} />} />
            <Route path="/admin" element={isLoggedIn ? <AdminPanel isSuperAdmin={adminData?.is_super_admin} currentUserId={adminData?.id} /> : <div className="alert alert-warning">Please login first</div>} />
            <Route path="/admin/analytics" element={isLoggedIn && adminData?.is_super_admin ? <AnalyticsPage isSuperAdmin={adminData?.is_super_admin} /> : <div className="alert alert-warning text-center py-5">Access denied. Super admin only.</div>} />
            <Route path="/admin/security" element={isLoggedIn && adminData?.is_super_admin ? <SecurityDashboard isSuperAdmin={adminData?.is_super_admin} /> : <div className="alert alert-warning text-center py-5">Access denied. Super admin only.</div>} />
            <Route path="/profile" element={<Profile isLoggedIn={isLoggedIn} adminData={adminData} onUpdate={fetchAdminData} />} />
          </Routes>
          
          {/* Modal Routes */}
          {backgroundLocation && (
            <Routes>
              <Route path="/login" element={
                <LoginModalContent 
                  loginCreds={loginCreds}
                  setLoginCreds={setLoginCreds}
                  handleLogin={(creds, onSuccess) => handleLogin(creds, onSuccess)}
                  onClose={() => navigate(-1)}
                />
              } />
            </Routes>
          )}
        </main>

        <Footer 
          isLoggedIn={isLoggedIn}
          adminData={adminData}
          handleLogout={handleLogout}
        />
      </div>

      <RegisterModal 
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}

export default App;

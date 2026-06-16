// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import tracking from '../utils/tracking';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/check-auth');
      setIsLoggedIn(response.data.authenticated);
      if (response.data.user) {
        setAdminData(response.data.user);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const response = await axios.get('/api/admin-info');
      setAdminData(response.data);
    } catch (error) {
      console.error('Failed to fetch admin data');
    }
  };

  const handleLogin = async (loginCreds, onSuccess) => {
    try {
      const response = await axios.post('/api/login', {
        identifier: loginCreds.identifier,
        password: loginCreds.password
      });
      if (response.data.success) {
        toast.success('Login successful!');
        setIsLoggedIn(true);
        setAdminData(response.data.user);
        
        await tracking.trackAction('login', `User: ${response.data.user.username}`, response.data.user.id, 'user');
        
        if (onSuccess) onSuccess();
        return true;
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Invalid credentials');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setIsLoggedIn(false);
      setAdminData(null);
      toast.success('Logged out');
      await tracking.trackAction('logout', 'User logged out', null, null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchAdminData();
  }, []);

  return {
    isLoggedIn,
    adminData,
    loading,
    handleLogin,
    handleLogout,
    fetchAdminData
  };
}
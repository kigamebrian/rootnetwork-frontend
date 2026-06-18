// frontend/src/pages/admin/AdminSubscribers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';  // adjust path if needed

function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/subscribers?page=${page}&search=${search}`, {
        withCredentials: true
      });
      setSubscribers(res.data.subscribers);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      if (err.response?.status === 401) {
        toast.error('Please login to access this page');
        navigate('/login');
      } else {
        toast.error('Failed to load subscribers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, search]);

  const handleUnsubscribe = async (id, email) => {
    if (!window.confirm(`Unsubscribe ${email}?`)) return;
    try {
      await axios.post(`${API_URL}/api/admin/subscribers/${id}/unsubscribe`, {}, {
        withCredentials: true
      });
      toast.success(`Unsubscribed ${email}`);
      fetchSubscribers();
    } catch (err) {
      toast.error('Error unsubscribing');
      console.error(err);
    }
  };

  const handleResend = async (id, email) => {
    if (!window.confirm(`Resend verification to ${email}?`)) return;
    try {
      await axios.post(`${API_URL}/api/admin/subscribers/${id}/resend-verification`, {}, {
        withCredentials: true
      });
      toast.success(`Verification resent to ${email}`);
    } catch (err) {
      toast.error('Error resending verification');
      console.error(err);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/subscribers/${id}`, {
        withCredentials: true
      });
      toast.success(`Deleted ${email}`);
      fetchSubscribers();
    } catch (err) {
      toast.error('Error deleting subscriber');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Subscriber Management</h2>
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-primary" onClick={fetchSubscribers}>
            <i className="fas fa-sync me-1"></i> Refresh
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Verified</th>
              <th>Active</th>
              <th>Frequency</th>
              <th>Categories</th>
              <th>Subscribed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr><td colSpan="8" className="text-center text-muted">No subscribers found</td></tr>
            ) : (
              subscribers.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.email}</td>
                  <td>{s.verified ? '✅' : '❌'}</td>
                  <td>{s.is_active ? '✅' : '❌'}</td>
                  <td>{s.preferences?.frequency || 'daily'}</td>
                  <td>{(s.preferences?.categories || []).length}</td>
                  <td>{new Date(s.subscribed_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => handleResend(s.id, s.email)}
                      disabled={s.verified}
                      title={s.verified ? 'Already verified' : 'Resend verification'}
                    >
                      Resend
                    </button>
                    <button
                      className="btn btn-sm btn-danger me-1"
                      onClick={() => handleUnsubscribe(s.id, s.email)}
                      disabled={!s.is_active}
                      title={!s.is_active ? 'Already unsubscribed' : 'Unsubscribe'}
                    >
                      Unsubscribe
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(s.id, s.email)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </button>
            </li>
            {[...Array(totalPages).keys()].map(p => (
              <li key={p} className={`page-item ${p + 1 === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(p + 1)}>{p + 1}</button>
              </li>
            ))}
            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default AdminSubscribers;

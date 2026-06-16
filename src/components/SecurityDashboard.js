// frontend/src/components/SecurityDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DataTable from './DataTable';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config'; // Add this import

function SecurityDashboard({ isSuperAdmin }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('logs');
  const [activityLogs, setActivityLogs] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useDocumentTitle('Security Dashboard', 'RootNetwork');

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadData();
  }, [activeTab, page, actionFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'logs') {
        const response = await axios.get(`${API_URL}/api/admin/activity-logs?page=${page}&action=${actionFilter}`, { withCredentials: true });
        setActivityLogs(response.data.logs);
        setTotalPages(response.data.pages);
      } else if (activeTab === 'suspicious') {
        const response = await axios.get(`${API_URL}/api/admin/suspicious-activities?page=${page}`, { withCredentials: true });
        setSuspiciousActivities(response.data.activities);
        setTotalPages(response.data.pages);
      } else if (activeTab === 'stats') {
        const response = await axios.get(`${API_URL}/api/admin/security-stats?days=7`, { withCredentials: true });
        setSecurityStats(response.data);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const resolveActivity = async (activityId) => {
    try {
      await axios.post(`${API_URL}/api/admin/suspicious-activities/${activityId}/resolve`, {}, { withCredentials: true });
      toast.success('Activity marked as resolved');
      loadData();
    } catch (error) {
      toast.error('Failed to resolve activity');
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = { low: 'bg-info', medium: 'bg-warning', high: 'bg-danger', critical: 'bg-dark' };
    return `badge ${colors[severity] || 'bg-secondary'}`;
  };

  const getActionBadge = (action) => {
    if (action === 'login_success') return 'bg-success';
    if (action === 'login_failed') return 'bg-danger';
    if (action === 'logout') return 'bg-secondary';
    if (action === 'create_post') return 'bg-primary';
    if (action === 'update_post') return 'bg-info';
    if (action === 'delete_post') return 'bg-danger';
    if (action === 'approve_comment') return 'bg-success';
    if (action === 'delete_comment') return 'bg-warning';
    if (action === 'create_category') return 'bg-primary';
    if (action === 'delete_category') return 'bg-danger';
    if (action === 'create_user') return 'bg-success';
    if (action === 'update_user') return 'bg-info';
    if (action === 'delete_user') return 'bg-danger';
    if (action === 'update_profile') return 'bg-info';
    return 'bg-secondary';
  };

  const formatActionName = (action) => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Filter suspicious activities
  const filteredActivities = useMemo(() => {
    let filtered = [...suspiciousActivities];
    if (severityFilter) filtered = filtered.filter(a => a.severity === severityFilter);
    if (dateRange.start) filtered = filtered.filter(a => new Date(a.detected_at) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(a => new Date(a.detected_at) <= new Date(dateRange.end));
    return filtered;
  }, [suspiciousActivities, severityFilter, dateRange]);

  // Activity Logs Columns
  const activityLogsColumns = [
    { field: 'username', header: 'User', sortable: true, searchable: true },
    { 
      field: 'action', 
      header: 'Action', 
      sortable: true,
      type: 'badge',
      format: formatActionName,
      badgeClass: getActionBadge
    },
    { field: 'action_details', header: 'Details', sortable: false, searchable: true },
    { field: 'ip_address', header: 'IP Address', sortable: true, searchable: true },
    { field: 'endpoint', header: 'Endpoint', sortable: true, searchable: true },
    { 
      field: 'status', 
      header: 'Status', 
      sortable: true,
      type: 'badge',
      format: (val) => val,
      badgeClass: (val) => val === 200 ? 'bg-success' : 'bg-danger'
    },
    { field: 'timestamp', header: 'Time', sortable: true, type: 'date' }
  ];

  // Suspicious Activities Columns
  const suspiciousColumns = [
    { 
      field: 'severity', 
      header: 'Severity', 
      sortable: true,
      type: 'badge',
      format: (val) => val.toUpperCase(),
      badgeClass: (val) => {
        if (val === 'critical') return 'bg-dark';
        if (val === 'high') return 'bg-danger';
        if (val === 'medium') return 'bg-warning';
        return 'bg-info';
      }
    },
    { field: 'category', header: 'Category', sortable: true, searchable: true },
    { field: 'description', header: 'Description', sortable: false, searchable: true },
    { field: 'ip_address', header: 'IP Address', sortable: true, searchable: true },
    { field: 'endpoint', header: 'Endpoint', sortable: true, searchable: true },
    { field: 'detected_at', header: 'Detected', sortable: true, type: 'date' },
    { 
      field: 'resolved', 
      header: 'Status', 
      sortable: true,
      type: 'badge',
      format: (val) => val ? 'Resolved' : 'Pending',
      badgeClass: (val) => val ? 'bg-success' : 'bg-warning'
    },
    { field: 'id', header: 'Actions', type: 'actions', sortable: false }
  ];

  if (!isSuperAdmin) {
    return (
      <div className="alert alert-warning text-center py-5">
        <i className="fas fa-shield-alt fa-3x mb-3 d-block"></i>
        <h4>Access Denied</h4>
        <p>Only Super Administrators can access the Security Dashboard.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/admin')}>
          <i className="fas fa-arrow-left me-1"></i> Back to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      {/* Header with Back Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-shield-alt me-2 text-danger"></i>
          Security & Intrusion Detection Dashboard
        </h2>
        <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
          <i className="fas fa-arrow-left me-1"></i> Back to Admin Panel
        </button>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('logs')}
          >
            <i className="fas fa-history me-1"></i> Activity Logs ({activityLogs.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'suspicious' ? 'active' : ''}`} 
            onClick={() => setActiveTab('suspicious')}
          >
            <i className="fas fa-exclamation-triangle me-1"></i> Suspicious Activities ({suspiciousActivities.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stats')}
          >
            <i className="fas fa-chart-bar me-1"></i> Security Statistics
          </button>
        </li>
      </ul>

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <DataTable
          data={activityLogs}
          title="Activity Logs"
          searchFields={['username', 'action', 'action_details', 'ip_address', 'endpoint']}
          exportFilename="activity_logs"
          pagination={true}
          itemsPerPage={20}
          customFilters={
            <div className="col-md-4">
              <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="">All Actions</option>
                <option value="login_success">Login Success</option>
                <option value="login_failed">Login Failed</option>
                <option value="logout">Logout</option>
                <option value="create_post">Create Post</option>
                <option value="update_post">Update Post</option>
                <option value="delete_post">Delete Post</option>
                <option value="approve_comment">Approve Comment</option>
                <option value="delete_comment">Delete Comment</option>
                <option value="create_category">Create Category</option>
                <option value="delete_category">Delete Category</option>
                <option value="create_user">Create User</option>
                <option value="update_user">Update User</option>
                <option value="delete_user">Delete User</option>
                <option value="update_profile">Update Profile</option>
              </select>
            </div>
          }
          columns={activityLogsColumns}
        />
      )}

      {/* Suspicious Activities Tab */}
      {activeTab === 'suspicious' && (
        <DataTable
          data={suspiciousActivities}
          title="Suspicious Activities"
          searchFields={['description', 'ip_address', 'category', 'endpoint']}
          exportFilename="suspicious_activities"
          pagination={true}
          itemsPerPage={20}
          customFilters={
            <>
              <div className="col-md-3">
                <select className="form-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="col-md-3">
                <input 
                  type="date" 
                  className="form-control" 
                  placeholder="From date" 
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="date" 
                  className="form-control" 
                  placeholder="To date" 
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                />
              </div>
            </>
          }
          columns={suspiciousColumns}
          actions={(row) => (
            !row.resolved && (
              <button className="btn btn-sm btn-success" onClick={() => resolveActivity(row.id)}>
                <i className="fas fa-check me-1"></i> Resolve
              </button>
            )
          )}
        />
      )}

      {/* Security Statistics Tab */}
      {activeTab === 'stats' && securityStats && (
        <div>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-danger text-white shadow">
                <div className="card-body text-center">
                  <i className="fas fa-exclamation-triangle fa-3x mb-2"></i>
                  <h5 className="card-title">Failed Logins (7 days)</h5>
                  <h2 className="display-4">{securityStats.failed_logins}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-chart-pie me-2"></i>
                    Suspicious Activities by Severity
                  </h5>
                  <div className="row mt-3">
                    {securityStats.suspicious_by_severity?.map(stat => (
                      <div className="col-md-3 text-center" key={stat.severity}>
                        <div className={`border rounded p-3 ${stat.severity === 'critical' ? 'border-dark' : stat.severity === 'high' ? 'border-danger' : 'border-warning'}`}>
                          <h6 className="text-muted mb-2">{stat.severity.toUpperCase()}</h6>
                          <h3 className={`mb-0 text-${stat.severity === 'critical' ? 'dark' : stat.severity === 'high' ? 'danger' : 'warning'}`}>
                            {stat.count}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Security Recommendations
              </h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {securityStats.failed_logins > 50 && (
                  <li className="list-group-item bg-warning bg-opacity-25">
                    <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                    High number of failed login attempts detected. Consider implementing CAPTCHA.
                  </li>
                )}
                {securityStats.suspicious_by_severity?.some(s => s.severity === 'critical') && (
                  <li className="list-group-item bg-danger bg-opacity-25">
                    <i className="fas fa-skull-crossbones text-danger me-2"></i>
                    Critical security threats detected. Review suspicious activities immediately.
                  </li>
                )}
                {securityStats.suspicious_by_severity?.length === 0 && securityStats.failed_logins === 0 && (
                  <li className="list-group-item bg-success bg-opacity-25">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    No security threats detected. Your system appears secure.
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Export Stats Button */}
          <div className="mt-4 text-end">
            <button 
              className="btn btn-success"
              onClick={() => {
                const dataStr = JSON.stringify(securityStats, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `security_stats_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Statistics exported!');
              }}
            >
              <i className="fas fa-download me-1"></i> Export Stats
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;

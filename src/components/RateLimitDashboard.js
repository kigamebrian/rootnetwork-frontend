import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function RateLimitDashboard({ isSuperAdmin }) {
  const [rules, setRules] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showBlockIP, setShowBlockIP] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    endpoint_pattern: '',
    method: 'ALL',
    limit_count: 60,
    time_window: 60,
    priority: 0
  });
  const [blockIPData, setBlockIPData] = useState({
    ip_address: '',
    reason: '',
    minutes: ''
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchData();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRules(),
        fetchBlockedIPs(),
        fetchStatus(),
        fetchLogs()
      ]);
    } catch (error) {
      console.error('Error fetching rate limit data:', error);
      toast.error('Failed to load rate limit data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rate-limits/rules', {
        withCredentials: true
      });
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rate-limits/blocked-ips', {
        withCredentials: true
      });
      setBlockedIPs(response.data);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rate-limits/status', {
        withCredentials: true
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rate-limits/logs?page=1&per_page=50', {
        withCredentials: true
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const createRule = async () => {
    try {
      await axios.post('http://localhost:5000/api/rate-limits/rules', newRule, {
        withCredentials: true
      });
      toast.success('Rate limit rule created successfully');
      await fetchRules();
      setShowAddRule(false);
      setNewRule({
        name: '',
        endpoint_pattern: '',
        method: 'ALL',
        limit_count: 60,
        time_window: 60,
        priority: 0
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    }
  };

  const deleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await axios.delete(`http://localhost:5000/api/rate-limits/rules/${ruleId}`, {
          withCredentials: true
        });
        toast.success('Rule deleted successfully');
        await fetchRules();
      } catch (error) {
        console.error('Error deleting rule:', error);
        toast.error('Failed to delete rule');
      }
    }
  };

  const toggleRule = async (rule) => {
    try {
      await axios.put(`http://localhost:5000/api/rate-limits/rules/${rule.id}`, {
        ...rule,
        is_active: !rule.is_active
      }, {
        withCredentials: true
      });
      toast.success(`Rule ${!rule.is_active ? 'activated' : 'deactivated'}`);
      await fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to toggle rule');
    }
  };

  const blockIP = async () => {
    if (!blockIPData.ip_address) {
      toast.error('IP address is required');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/rate-limits/blocked-ips', blockIPData, {
        withCredentials: true
      });
      toast.success(`IP ${blockIPData.ip_address} blocked successfully`);
      await fetchBlockedIPs();
      setShowBlockIP(false);
      setBlockIPData({ ip_address: '', reason: '', minutes: '' });
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error('Failed to block IP');
    }
  };

  const unblockIP = async (ipAddress) => {
    if (window.confirm(`Unblock ${ipAddress}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/rate-limits/blocked-ips/${ipAddress}`, {
          withCredentials: true
        });
        toast.success(`IP ${ipAddress} unblocked`);
        await fetchBlockedIPs();
      } catch (error) {
        console.error('Error unblocking IP:', error);
        toast.error('Failed to unblock IP');
      }
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="alert alert-warning text-center py-5">
        <i className="fas fa-lock fa-3x mb-3"></i>
        <h4>Access Denied</h4>
        <p>Only Super Administrators can access the Rate Limit Dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {status && status.summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h6 className="card-title">Total Requests Today</h6>
                <h3 className="mb-0">{status.summary.total_requests_today || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h6 className="card-title">Blocked Requests</h6>
                <h3 className="mb-0">{status.summary.blocked_requests_today || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body">
                <h6 className="card-title">Blocked IPs</h6>
                <h3 className="mb-0">{status.summary.blocked_ips_count || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h6 className="card-title">Active Rules</h6>
                <h3 className="mb-0">{status.summary.active_rules_count || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Rules Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-shield-alt me-2"></i>
            Rate Limit Rules
          </h5>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddRule(true)}>
            <i className="fas fa-plus me-1"></i> Add Rule
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Endpoint Pattern</th>
                  <th>Method</th>
                  <th>Limit</th>
                  <th>Time Window</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td><strong>{rule.name}</strong></td>
                    <td><code>{rule.endpoint_pattern}</code></td>
                    <td><span className="badge bg-secondary">{rule.method}</span></td>
                    <td>{rule.limit_count}</td>
                    <td>{rule.time_window} sec</td>
                    <td>{rule.priority}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${rule.is_active ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => toggleRule(rule)}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No rate limit rules configured. Add your first rule!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Blocked IPs Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-ban me-2"></i>
            Blocked IP Addresses
          </h5>
          <button className="btn btn-danger btn-sm" onClick={() => setShowBlockIP(true)}>
            <i className="fas fa-plus me-1"></i> Block IP
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Blocked By</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map(ip => (
                  <tr key={ip.id}>
                    <td><code>{ip.ip_address}</code></td>
                    <td>{ip.reason}</td>
                    <td>{ip.blocked_by}</td>
                    <td>
                      {ip.is_permanent ? 
                        <span className="badge bg-danger">Permanent</span> : 
                        new Date(ip.blocked_until).toLocaleString()
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => unblockIP(ip.ip_address)}
                      >
                        <i className="fas fa-unlock"></i> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {blockedIPs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No blocked IP addresses.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Logs Section */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Recent Rate Limit Logs (Last 50)
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><code>{log.ip_address}</code></td>
                    <td>{log.endpoint}</td>
                    <td><span className="badge bg-info">{log.method}</span></td>
                    <td>
                      {log.was_blocked ? (
                        <span className="badge bg-danger">Blocked</span>
                      ) : (
                        <span className="badge bg-success">Allowed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Rate Limit Rule</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddRule(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rule Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., API Login Limit"
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Endpoint Pattern</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="/api/login, /api/posts/*"
                    value={newRule.endpoint_pattern}
                    onChange={(e) => setNewRule({...newRule, endpoint_pattern: e.target.value})}
                  />
                  <small className="text-muted">Use * for wildcard matching</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">HTTP Method</label>
                  <select
                    className="form-select"
                    value={newRule.method}
                    onChange={(e) => setNewRule({...newRule, method: e.target.value})}
                  >
                    <option value="ALL">ALL</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Limit Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newRule.limit_count}
                      onChange={(e) => setNewRule({...newRule, limit_count: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time Window (seconds)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newRule.time_window}
                      onChange={(e) => setNewRule({...newRule, time_window: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <label className="form-label">Priority (higher = checked first)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddRule(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createRule}>Create Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block IP Modal */}
      {showBlockIP && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Block IP Address</h5>
                <button type="button" className="btn-close" onClick={() => setShowBlockIP(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">IP Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="192.168.1.1"
                    value={blockIPData.ip_address}
                    onChange={(e) => setBlockIPData({...blockIPData, ip_address: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Why is this IP being blocked?"
                    value={blockIPData.reason}
                    onChange={(e) => setBlockIPData({...blockIPData, reason: e.target.value})}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Duration (minutes, leave empty for permanent)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="60"
                    value={blockIPData.minutes}
                    onChange={(e) => setBlockIPData({...blockIPData, minutes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowBlockIP(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={blockIP}>Block IP</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RateLimitDashboard;
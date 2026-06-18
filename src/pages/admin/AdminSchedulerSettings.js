// frontend/src/pages/admin/AdminSchedulerSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import API_URL from '../../config';   // <-- import config

function AdminSchedulerSettings() {
  const [settings, setSettings] = useState({
    daily_digest_hour: '8',
    daily_digest_minute: '0',
    weekly_digest_day: 'mon',
    weekly_digest_hour: '9',
    weekly_digest_minute: '0',
    publish_interval_minutes: '1'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/settings/scheduler`, {
        withCredentials: true
      });
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/admin/settings/scheduler`, settings, {
        withCredentials: true
      });
      toast.success('Settings updated and scheduler reloaded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#07255b' }} /></div>;

  return (
    <div className="container py-4">
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
        .btn-theme:focus {
          box-shadow: 0 0 0 0.2rem rgba(7, 37, 91, 0.25);
        }
        .border-theme {
          border-color: #07255b !important;
        }
        .bg-theme {
          background-color: #07255b !important;
        }
        .form-control:focus {
          border-color: #07255b;
          box-shadow: 0 0 0 0.2rem rgba(7, 37, 91, 0.25);
        }
      `}</style>

      <h2 className="mb-4" style={{ color: '#07255b' }}>
        <i className="fas fa-clock me-2"></i>Scheduler Settings
      </h2>
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="border-bottom pb-2" style={{ borderColor: '#07255b !important' }}>Daily Digest</h5>
                <div className="row">
                  <div className="col-6">
                    <label className="form-label">Hour (0–23)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.daily_digest_hour}
                      onChange={(e) => handleChange('daily_digest_hour', e.target.value)}
                      min="0" max="23"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Minute (0–59)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.daily_digest_minute}
                      onChange={(e) => handleChange('daily_digest_minute', e.target.value)}
                      min="0" max="59"
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <h5 className="border-bottom pb-2" style={{ borderColor: '#07255b !important' }}>Weekly Digest</h5>
                <div className="row">
                  <div className="col-4">
                    <label className="form-label">Day</label>
                    <select
                      className="form-select"
                      value={settings.weekly_digest_day}
                      onChange={(e) => handleChange('weekly_digest_day', e.target.value)}
                    >
                      <option value="mon">Monday</option>
                      <option value="tue">Tuesday</option>
                      <option value="wed">Wednesday</option>
                      <option value="thu">Thursday</option>
                      <option value="fri">Friday</option>
                      <option value="sat">Saturday</option>
                      <option value="sun">Sunday</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label">Hour (0–23)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.weekly_digest_hour}
                      onChange={(e) => handleChange('weekly_digest_hour', e.target.value)}
                      min="0" max="23"
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Minute (0–59)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.weekly_digest_minute}
                      onChange={(e) => handleChange('weekly_digest_minute', e.target.value)}
                      min="0" max="59"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="border-bottom pb-2" style={{ borderColor: '#07255b !important' }}>Scheduled Posts</h5>
                <div className="row">
                  <div className="col-12">
                    <label className="form-label">Check Interval (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.publish_interval_minutes}
                      onChange={(e) => handleChange('publish_interval_minutes', e.target.value)}
                      min="1"
                    />
                    <small className="text-muted">How often to check for scheduled posts to publish.</small>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-theme" disabled={saving}>
              {saving ? 'Saving...' : 'Save & Reload Scheduler'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminSchedulerSettings;

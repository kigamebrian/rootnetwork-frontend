// frontend/src/pages/AnalyticsPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config';   // <-- import config

function AnalyticsPage({ isSuperAdmin }) {
  const navigate = useNavigate();
  
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingDebug, setLoadingDebug] = useState(false);
  
  const [analytics, setAnalytics] = useState(null);
  const [locationAnalytics, setLocationAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  
  useDocumentTitle('Analytics', 'RootNetwork');

  const abortControllerRef = useRef(null);

  const goBack = useCallback(() => navigate('/admin'), [navigate]);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Access denied. Super admin only.');
      navigate('/admin');
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const loadData = async () => {
      setError(null);
      setLoadingAnalytics(true);
      setLoadingLocation(true);
      
      // Only fetch debug in development
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) setLoadingDebug(true);
      
      try {
        const promises = [
          axios.get(`${API_URL}/api/admin/analytics?days=${days}`, {
            signal: controller.signal,
            withCredentials: true
          }),
          axios.get(`${API_URL}/api/admin/analytics/locations?days=${days}`, {
            signal: controller.signal,
            withCredentials: true
          })
        ];
        
        // Debug endpoint only in development
        if (isDev) {
          promises.push(
            axios.get(`${API_URL}/api/track/debug/geo`, {
              signal: controller.signal,
              withCredentials: true
            })
          );
        }
        
        const [analyticsRes, locationRes, debugRes] = await Promise.all(promises);
        
        setAnalytics(analyticsRes.data);
        setLocationAnalytics(locationRes.data);
        
        if (debugRes) {
          setDebugInfo(debugRes.data);
        }
        
        setError(null);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data. Please try again.');
        toast.error('Failed to load analytics');
      } finally {
        setLoadingAnalytics(false);
        setLoadingLocation(false);
        if (isDev) setLoadingDebug(false);
      }
    };
    
    loadData();
    
    return () => {
      controller.abort();
    };
  }, [days]);

  useEffect(() => {
    if (showDebug && process.env.NODE_ENV === 'development') {
      const fetchDebug = async () => {
        setLoadingDebug(true);
        try {
          const response = await axios.get(`${API_URL}/api/track/debug/geo`, {
            withCredentials: true
          });
          setDebugInfo(response.data);
        } catch (err) {
          console.error('Failed to fetch debug info:', err);
          toast.error('Failed to load debug info');
        } finally {
          setLoadingDebug(false);
        }
      };
      fetchDebug();
    }
  }, [showDebug]);

  const popularPostsData = useMemo(() => analytics?.popular_posts ?? [], [analytics]);
  const dailyViewsData = useMemo(() => analytics?.daily_views ?? [], [analytics]);
  const userActionsData = useMemo(() => analytics?.action_counts ?? [], [analytics]);
  const visitorLocationsData = useMemo(() => locationAnalytics?.visitor_locations ?? [], [locationAnalytics]);
  const viewsByCountryData = useMemo(() => locationAnalytics?.views_by_country ?? [], [locationAnalytics]);

  const processedDailyViews = useMemo(() => {
    return dailyViewsData.map((day, index, arr) => {
      const prev = arr[index - 1];
      const change = prev && prev.count > 0
        ? ((day.count - prev.count) / prev.count) * 100
        : 0;
      return {
        ...day,
        change: index > 0 ? (
          <span className={change >= 0 ? 'text-success' : 'text-danger'}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        ) : '-'
      };
    });
  }, [dailyViewsData]);

  const engagementRate = useMemo(() => {
    if (!analytics) return 0;
    if (analytics.unique_visitors > 0) {
      return Math.round((analytics.total_views / analytics.unique_visitors) * 10) / 10;
    }
    return 0;
  }, [analytics]);

  const totalViews = analytics?.total_views ?? 0;

  const hasLocationData = useMemo(() => {
    return visitorLocationsData.length > 0 && 
      visitorLocationsData.some(item => item.country !== 'Local' && item.country !== 'Unknown');
  }, [visitorLocationsData]);

  const popularPostsColumns = useMemo(() => [
    { field: 'rank', header: '#', sortable: false, width: '50px' },
    { field: 'title', header: 'Title', sortable: true, searchable: true },
    { field: 'views', header: 'Views', sortable: true },
    { field: 'id', header: 'Actions', type: 'actions', sortable: false }
  ], []);

  const dailyViewsColumns = useMemo(() => [
    { field: 'date', header: 'Date', sortable: true, type: 'date' },
    { field: 'count', header: 'Views', sortable: true },
    { field: 'change', header: 'Daily Change', sortable: true }
  ], []);

  const visitorLocationsColumns = useMemo(() => [
    { 
      field: 'country', 
      header: 'Country', 
      sortable: true, 
      searchable: true,
      format: (val) => {
        if (val === 'Local' || val === 'Unknown') {
          return <span className="text-muted"><i className="fas fa-circle me-1" style={{ color: val === 'Local' ? '#6c757d' : '#ffc107' }}></i>{val}</span>;
        }
        return <span><i className="fas fa-flag me-1"></i>{val}</span>;
      }
    },
    { 
      field: 'city', 
      header: 'City', 
      sortable: true, 
      searchable: true,
      format: (val) => {
        if (!val || val === 'Local' || val === 'Unknown') return <span className="text-muted">—</span>;
        return val;
      }
    },
    { 
      field: 'visitor_count', 
      header: 'Visitors', 
      sortable: true,
      format: (val) => <span className="fw-bold">{val}</span>
    }
  ], []);

  const viewsByCountryColumns = useMemo(() => [
    { 
      field: 'country', 
      header: 'Country', 
      sortable: true, 
      searchable: true,
      format: (val) => {
        if (val === 'Local' || val === 'Unknown') return <span className="text-muted">{val}</span>;
        return <span><i className="fas fa-flag me-1"></i>{val}</span>;
      }
    },
    { field: 'views', header: 'Page Views', sortable: true },
    { 
      field: 'percentage', 
      header: '% of Total', 
      sortable: true,
      format: (val) => val || '0.0%'
    }
  ], []);

  const userActionsColumns = useMemo(() => [
    { field: 'action', header: 'Action', sortable: true, searchable: true },
    { field: 'count', header: 'Count', sortable: true }
  ], []);

  if (loadingAnalytics || loadingLocation) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          <i className="fas fa-sync-alt me-1"></i> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-secondary" onClick={goBack}>
            <i className="fas fa-arrow-left me-1"></i> Back to Admin
          </button>
          <h2 className="mb-0">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Analytics Dashboard
          </h2>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select w-auto" value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-2">Total Page Views</h6>
              <h2 className="display-6 mb-0">{analytics?.total_views ?? 0}</h2>
              <small>Last {days} days</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-2">Unique Visitors</h6>
              <h2 className="display-6 mb-0">{analytics?.unique_visitors ?? 0}</h2>
              <small>Last {days} days</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-2">Avg. Views/Day</h6>
              <h2 className="display-6 mb-0">
                {days > 0 ? Math.round((analytics?.total_views ?? 0) / days) : 0}
              </h2>
              <small>Daily average</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-2">Engagement Rate</h6>
              <h2 className="display-6 mb-0">{engagementRate}</h2>
              <small>Views per visitor</small>
            </div>
          </div>
        </div>
      </div>

      {!hasLocationData && (
        <div className="alert alert-warning mb-4">
          <i className="fas fa-info-circle me-2"></i>
          <strong>No location data available.</strong> 
          {visitorLocationsData.length === 0 ? (
            ' No visitors have been tracked yet. Make sure your tracking code is working.'
          ) : (
            ' Only local/unknown visitors detected. Check your geolocation service configuration.'
          )}
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="btn btn-sm btn-outline-primary ms-3"
              onClick={() => setShowDebug(!showDebug)}
            >
              <i className="fas fa-bug me-1"></i> 
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          )}
        </div>
      )}

      {showDebug && process.env.NODE_ENV === 'development' && (
        <div className="card mb-4 border-warning">
          <div className="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-bug me-2"></i>Geolocation Debug Information</h6>
            {loadingDebug && <div className="spinner-border spinner-border-sm text-warning" role="status"><span className="visually-hidden">Loading...</span></div>}
          </div>
          <div className="card-body">
            {debugInfo ? (
              <>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead><tr><th>Original IP</th><th>Cleaned IP</th><th>Country</th><th>City</th><th>Is Private?</th></tr></thead>
                    <tbody>
                      {debugInfo.results?.map((item, idx) => (
                        <tr key={idx}>
                          <td><code>{item.original_ip}</code></td>
                          <td><code>{item.cleaned_ip}</code></td>
                          <td><span className={item.country === 'Unknown' || item.country === 'Local' ? 'text-muted' : ''}>{item.country}</span></td>
                          <td>{item.city}</td>
                          <td><span className={item.is_private ? 'text-warning' : 'text-success'}>{item.is_private ? 'Yes' : 'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <small className="text-muted"><i className="fas fa-info-circle me-1"></i>Cache size: {debugInfo.cache_size || 0} entries</small>
              </>
            ) : (
              <p className="text-muted text-center py-3"><i className="fas fa-spinner fa-spin me-2"></i>Loading debug data...</p>
            )}
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-6">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="badge bg-secondary">{popularPostsData.length} posts</span>
            </div>
            <div className="card-body p-0">
              <DataTable
                data={popularPostsData.map((post, index) => ({
                  ...post,
                  rank: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1).toString()
                }))}
                columns={popularPostsColumns}
                title="Most Popular Posts"
                searchable={true}
                searchFields={['title']}
                exportable={true}
                exportFilename={`popular_posts_${days}d`}
                pagination={false}
                actions={(row) => (
                  <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/blog/post/${row.slug}`)} title="View Post">
                    <i className="fas fa-eye"></i>
                  </button>
                )}
              />
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-white">
            </div>
            <div className="card-body p-0">
              <DataTable
                data={userActionsData}
                columns={userActionsColumns}
                title="User Activity"
                searchable={true}
                searchFields={['action']}
                exportable={true}
                exportFilename={`user_actions_${days}d`}
                pagination={false}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="badge bg-secondary">{visitorLocationsData.filter(item => item.country !== 'Local' && item.country !== 'Unknown').length} countries</span>
            </div>
            <div className="card-body p-0">
              <DataTable
                data={visitorLocationsData}
                columns={visitorLocationsColumns}
                title="Visitor Locations"
                searchable={true}
                searchFields={['country', 'city']}
                exportable={true}
                exportFilename={`visitor_locations_${days}d`}
                pagination={false}
              />
              {visitorLocationsData.length === 0 && (
                <div className="text-center py-4 text-muted"><i className="fas fa-globe fa-2x mb-2 d-block"></i>No location data available yet.</div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-white">
            </div>
            <div className="card-body p-0">
              <DataTable
                data={viewsByCountryData.map(view => ({
                  ...view,
                  percentage: totalViews > 0 ? ((view.views / totalViews) * 100).toFixed(1) + '%' : '0.0%'
                }))}
                columns={viewsByCountryColumns}
                title="Page Views by Country"
                searchable={true}
                searchFields={['country']}
                exportable={true}
                exportFilename={`views_by_country_${days}d`}
                pagination={false}
              />
              {viewsByCountryData.length === 0 && (
                <div className="text-center py-4 text-muted"><i className="fas fa-chart-bar fa-2x mb-2 d-block"></i>No country data available yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="badge bg-secondary">{dailyViewsData.length} days</span>
        </div>
        <div className="card-body p-0">
          <DataTable
            data={processedDailyViews}
            columns={dailyViewsColumns}
            title="Daily Page Views"
            searchable={true}
            searchFields={['date']}
            exportable={true}
            exportFilename={`daily_views_${days}d`}
            pagination={false}
          />
        </div>
      </div>

      <div className="mt-4 d-flex justify-content-between gap-2 flex-wrap">
        <button className="btn btn-secondary" onClick={goBack}>
          <i className="fas fa-arrow-left me-2"></i> Back to Admin Panel
        </button>
        <button 
          className="btn btn-success"
          onClick={() => {
            const allData = {
              summary: {
                total_views: analytics?.total_views,
                unique_visitors: analytics?.unique_visitors,
                period_days: days,
                engagement_rate: engagementRate,
                avg_daily_views: days > 0 ? Math.round((analytics?.total_views ?? 0) / days) : 0
              },
              popular_posts: analytics?.popular_posts,
              user_actions: analytics?.action_counts,
              daily_views: analytics?.daily_views,
              visitor_locations: locationAnalytics?.visitor_locations,
              views_by_country: locationAnalytics?.views_by_country,
              exported_at: new Date().toISOString(),
              date_range: `${days} days`
            };
            const dataStr = JSON.stringify(allData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_report_${days}d_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Full report exported!');
          }}
        >
          <i className="fas fa-download me-1"></i> Export Full Report (JSON)
        </button>
      </div>

      <style>{`
        .analytics-page .table {
          font-size: 0.9rem;
          margin-bottom: 0;
        }
        .analytics-page .table th {
          font-weight: 600;
          border-bottom-width: 1px;
          color: #495057;
          background-color: #f8f9fa;
        }
        .analytics-page .table td {
          vertical-align: middle;
          padding: 0.6rem 0.75rem;
        }
        .analytics-page .table tbody tr:hover {
          background-color: #f1f3f5;
        }
        .analytics-page .card-body.p-0 .table {
          border-collapse: collapse;
        }
        .analytics-page .card-body.p-0 .table th:first-child,
        .analytics-page .card-body.p-0 .table td:first-child {
          padding-left: 1.25rem;
        }
        .analytics-page .card-body.p-0 .table th:last-child,
        .analytics-page .card-body.p-0 .table td:last-child {
          padding-right: 1.25rem;
        }
        .analytics-page .badge {
          font-size: 0.75rem;
        }
        .analytics-page .card-header {
          padding: 0.75rem 1.25rem;
          background-color: #fff;
          border-bottom: 1px solid #e9ecef;
        }
        .analytics-page .card-header h5 {
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}

export default AnalyticsPage;

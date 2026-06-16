// frontend/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import DataTable from './DataTable';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config'; // Add this import

function Profile({ isLoggedIn, adminData, onUpdate }) {
  useDocumentTitle('Profile', 'RootNetwork');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    current_password: '',
    password: '',
    blog_title: '',
    blog_subtitle: '',
    about: ''
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    fetchUserProfile();
  }, [isLoggedIn, navigate, currentPage]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        withCredentials: true,
        params: { page: currentPage, per_page: 10 }
      });
      const userData = response.data;
      setProfileData(userData);
      setUserPosts(userData.posts || []);
      setTotalPages(userData.total_pages || 1);
      setFormData({
        email: userData.email || '',
        username: userData.username || '',
        full_name: userData.full_name || '',
        current_password: '',
        password: '',
        blog_title: userData.blog_title || '',
        blog_subtitle: userData.blog_subtitle || '',
        about: userData.about || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploadingImage(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload-profile-image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      toast.success('Profile image updated!');
      fetchUserProfile();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to upload image', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && !formData.current_password) {
      toast.error('Current password is required to change password');
      return;
    }
    
    setLoading(true);
    
    try {
      const updateData = {
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        blog_title: formData.blog_title,
        blog_subtitle: formData.blog_subtitle,
        about: formData.about
      };
      
      if (formData.password) {
        updateData.current_password = formData.current_password;
        updateData.password = formData.password;
      }
      
      await axios.put(`${API_URL}/api/user/profile`, updateData, {
        withCredentials: true
      });
      
      toast.success('Profile updated successfully!');
      fetchUserProfile();
      if (onUpdate) onUpdate();
      
      setFormData(prev => ({ ...prev, current_password: '', password: '' }));
      
    } catch (error) {
      console.error('Failed to update profile', error);
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMsg);
      
      if (errorMsg.includes('password')) {
        setFormData(prev => ({ ...prev, current_password: '', password: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Posts Columns for DataTable
  const postsColumns = [
    { field: 'title', header: 'Title', sortable: true, searchable: true },
    { field: 'comment_count', header: 'Comments', sortable: true },
    { field: 'timestamp', header: 'Date', sortable: true, type: 'date' },
    { field: 'id', header: 'Actions', type: 'actions', sortable: false }
  ];

  if (!isLoggedIn) {
    return null;
  }

  if (loading && !profileData) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header with Back Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')}
        >
          <i className="fas fa-arrow-left me-1"></i> Back to Home
        </button>
        {profileData?.is_super_admin && (
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/admin')}
          >
            <i className="fas fa-tachometer-alt me-1"></i> Go to Admin Panel
          </button>
        )}
      </div>

      <div className="row">
        {/* Profile Image Card */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <div className="mb-3">
                {profileData?.profile_image && profileData.profile_image !== 'default-avatar.png' ? (
                  <img
                    src={`${API_URL}/static/${profileData.profile_image}`}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid #667eea' }}
                    onError={(e) => {
                      e.target.src = `${API_URL}/static/default-avatar.png`;
                    }}
                  />
                ) : (
                  <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto" style={{ width: '150px', height: '150px' }}>
                    <i className="fas fa-user fa-4x text-white"></i>
                  </div>
                )}
              </div>
              <h4 className="mb-1">{profileData?.full_name || profileData?.username}</h4>
              <p className="text-muted">@{profileData?.username}</p>
              <div className="mt-3">
                <label className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-camera me-1"></i> Change Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                  />
                </label>
                {uploadingImage && (
                  <div className="spinner-border spinner-border-sm ms-2" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Account Info Card */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title">
                <i className="fas fa-info-circle me-2"></i>
                Account Info
              </h5>
              <hr />
              <p>
                <strong>Role:</strong>{' '}
                {profileData?.is_super_admin ? (
                  <span className="badge bg-danger">Super Admin</span>
                ) : (
                  <span className="badge bg-info">User</span>
                )}
              </p>
              <p>
                <strong>Member since:</strong>{' '}
                {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <strong>Last login:</strong>{' '}
                {profileData?.last_login ? new Date(profileData.last_login).toLocaleString() : 'First login'}
              </p>
              <p>
                <strong>Posts written:</strong> {profileData?.post_count || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Edit Profile Form */}
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="card-title mb-4">
                <i className="fas fa-user-edit me-2"></i>
                Edit Profile
              </h4>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Blog Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="blog_title"
                    value={formData.blog_title}
                    onChange={handleInputChange}
                    placeholder="My Awesome Blog"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Blog Subtitle</label>
                  <input
                    type="text"
                    className="form-control"
                    name="blog_subtitle"
                    value={formData.blog_subtitle}
                    onChange={handleInputChange}
                    placeholder="Welcome to my blog"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">About Me</label>
                  <textarea
                    className="form-control"
                    name="about"
                    rows="4"
                    value={formData.about}
                    onChange={handleInputChange}
                    placeholder="Tell something about yourself..."
                  ></textarea>
                </div>
                
                <hr className="my-4" />
                <h5 className="mb-3">
                  <i className="fas fa-key me-2"></i>
                  Change Password
                </h5>
                
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="current_password"
                    placeholder="Required to change password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <small className="text-muted">Minimum 8 characters with uppercase, lowercase, number, and special character</small>
                </div>
                
                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* My Posts Section with DataTable */}
          {userPosts.length > 0 && (
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-pen-alt me-2"></i>
                  My Posts
                </h5>
                <span className="badge bg-secondary">{profileData?.post_count || 0} total posts</span>
              </div>
              <div className="card-body p-0">
                <DataTable
                  data={userPosts}
                  columns={postsColumns}
                  searchable={true}
                  searchFields={['title']}
                  exportable={true}
                  exportFilename="my_posts"
                  pagination={true}
                  itemsPerPage={5}
                  actions={(row) => (
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/blog/post/${row.slug}`)}
                        title="View Post"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {profileData?.is_super_admin && (
                        <button 
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => navigate(`/admin?edit=${row.slug}`)}
                          title="Edit Post"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          )}
          
          {userPosts.length === 0 && (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-pen-alt fa-3x text-muted mb-3"></i>
                <h5>No posts yet</h5>
                <p className="text-muted">You haven't written any posts yet.</p>
                {profileData?.is_super_admin && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/admin')}
                  >
                    <i className="fas fa-plus me-1"></i> Create Your First Post
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

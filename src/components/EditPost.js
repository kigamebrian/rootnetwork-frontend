// frontend/src/components/EditPost.js - Updated with Scheduling & Document Title
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config'; // Add this import

function EditPost({ isLoggedIn, currentUserId, isSuperAdmin }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    image: '',
    status: 'draft',
    scheduled_for: ''
  });

  // Set document title based on whether we're creating or editing
  const pageTitle = slug ? 'Edit Post' : 'Create New Post';
  useDocumentTitle(pageTitle, 'RootNetwork');

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('Please login first');
      navigate('/');
      return;
    }
    fetchCategories();
    if (slug) {
      fetchPost();
    } else {
      setLoading(false);
    }
  }, [slug, isLoggedIn]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/posts/${slug}`);
      const post = response.data;
      
      if (!isSuperAdmin && post.author_id !== currentUserId) {
        toast.error('You do not have permission to edit this post');
        navigate('/admin');
        return;
      }
      
      setFormData({
        title: post.title || '',
        content: post.content || '',
        category_id: post.category_id || '',
        image: post.image || '',
        status: post.status || 'draft',
        scheduled_for: post.scheduled_for || ''
      });
    } catch (error) {
      console.error('Failed to fetch post', error);
      toast.error('Failed to load post');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
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

    const formDataImg = new FormData();
    formDataImg.append('image', file);

    setUploadingImage(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload-post-image`, formDataImg, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setFormData({ ...formData, image: response.data.image_url });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload image', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.category_id) {
      toast.error('Please select a category first');
      return;
    }
    
    if (!formData.title) {
      toast.error('Please enter a title first');
      return;
    }
    
    setAiGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/write`, {
        category_id: formData.category_id,
        title: formData.title
      }, { withCredentials: true });
      
      setFormData({...formData, content: response.data.content});
      toast.success('AI content generated!');
    } catch (error) {
      console.error('Failed to generate AI content', error);
      toast.error('Failed to generate AI content');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    
    if (formData.status === 'scheduled' && !formData.scheduled_for) {
      toast.error('Please select a date and time for scheduled post');
      return;
    }
    
    setSaving(true);
    
    try {
      if (slug) {
        const postResponse = await axios.get(`${API_URL}/api/posts/${slug}`);
        const postId = postResponse.data.id;
        await axios.put(`${API_URL}/api/admin/posts/${postId}`, formData, { withCredentials: true });
        toast.success('Post updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/admin/posts`, formData, { withCredentials: true });
        toast.success('Post created successfully!');
      }
      navigate('/admin');
    } catch (error) {
      console.error('Failed to save post', error);
      toast.error(error.response?.data?.error || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/admin');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

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
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h3 className="mb-0">{slug ? 'Edit Post' : 'Create New Post'}</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter post title..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Category *</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                required
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.post_count} posts)
                  </option>
                ))}
              </select>
            </div>

            {/* Post Status Section */}
            <div className="mb-3">
              <label className="form-label fw-bold">Post Status</label>
              <select 
                className="form-select" 
                value={formData.status} 
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFormData({...formData, status: newStatus});
                  if (newStatus !== 'scheduled') {
                    setFormData({...formData, status: newStatus, scheduled_for: ''});
                  }
                }}
              >
                <option value="draft">📝 Draft - Save and continue later</option>
                <option value="published">🚀 Publish Now</option>
                <option value="scheduled">📅 Schedule for Later</option>
              </select>
              <small className="text-muted">
                {formData.status === 'draft' && 'Draft posts are only visible to you in the admin panel.'}
                {formData.status === 'published' && 'Post will be visible to everyone immediately.'}
                {formData.status === 'scheduled' && 'Set a future date and time for automatic publishing.'}
              </small>
            </div>

            {formData.status === 'scheduled' && (
              <div className="mb-3">
                <label className="form-label fw-bold">Schedule Publish Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.scheduled_for}
                  onChange={(e) => setFormData({...formData, scheduled_for: e.target.value})}
                  required
                />
                <small className="text-muted">
                  <i className="fas fa-calendar-alt me-1"></i>
                  Post will be published automatically at this time
                </small>
              </div>
            )}

            {/* Featured Image Upload */}
            <div className="mb-3">
              <label className="form-label fw-bold">Featured Image</label>
              <div className="border rounded p-3">
                {formData.image && (
                  <div className="mb-3">
                    <img 
                      src={getImageUrl(formData.image)} 
                      alt="Featured" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger mt-2"
                      onClick={() => setFormData({...formData, image: ''})}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Uploading...</span>
                    </div>
                  )}
                </div>
                <small className="text-muted">Supported formats: PNG, JPG, JPEG, GIF, WEBP (Max 5MB)</small>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Content *</label>
              <div className="mb-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Generating...
                    </>
                  ) : (
                    '✨ AI Write'
                  )}
                </button>
              </div>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({...formData, content})}
                placeholder="Write your post content here or use AI Write..."
              />
            </div>

            <div className="row mt-4">
              <div className="col">
                <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    slug ? 'Update Post' : 'Create Post'
                  )}
                </button>
              </div>
              <div className="col">
                <button type="button" className="btn btn-secondary w-100" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPost;

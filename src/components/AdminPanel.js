// frontend/src/components/AdminPanel.js - CORRECTED VERSION
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import DataTable from './DataTable';
import RateLimitDashboard from './RateLimitDashboard';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Extract PostModal as a separate memoized component
const PostModal = React.memo(({ 
  showCreateForm, 
  editingPost, 
  postForm, 
  setPostForm, 
  categories, 
  handleImageUpload, 
  uploadingImage, 
  handleUpdatePost, 
  handleCreatePost, 
  cancelEdit, 
  isUpdating, 
  isCreating, 
  editorKey 
}) => {
  if (!showCreateForm && !editingPost) return null;
  
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', top: '50%', transform: 'translateY(-50%)' }}>
        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h3 className="mb-0">{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
          <button type="button" className="btn-close" onClick={cancelEdit}></button>
        </div>
        <div className="modal-body">
          <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} id="postForm">
            <div className="mb-3">
              <label className="form-label fw-bold">Title *</label>
              <input type="text" className="form-control" value={postForm.title} onChange={(e) => setPostForm({...postForm, title: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Category</label>
              <select className="form-select" value={postForm.category_id} onChange={(e) => setPostForm({...postForm, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Post Status</label>
              <select className="form-select" value={postForm.status} onChange={(e) => { const newStatus = e.target.value; setPostForm({...postForm, status: newStatus}); if (newStatus !== 'scheduled') setPostForm({...postForm, status: newStatus, scheduled_for: ''}); }}>
                <option value="draft">📝 Draft - Save and continue later</option>
                <option value="published">🚀 Publish Now</option>
                <option value="scheduled">📅 Schedule for Later</option>
              </select>
              <small className="text-muted">
                {postForm.status === 'draft' && 'Draft posts are only visible to you in the admin panel.'}
                {postForm.status === 'published' && 'Post will be visible to everyone immediately.'}
                {postForm.status === 'scheduled' && 'Set a future date and time for automatic publishing.'}
              </small>
            </div>
            {postForm.status === 'scheduled' && (
              <div className="mb-3">
                <label className="form-label fw-bold">Schedule Publish Date</label>
                <input type="datetime-local" className="form-control" value={postForm.scheduled_for} onChange={(e) => { const localDateTime = e.target.value; if (localDateTime) { const date = new Date(localDateTime); setPostForm({...postForm, scheduled_for: date.toISOString()}); } else { setPostForm({...postForm, scheduled_for: ''}); } }} required />
                <small className="text-muted"><i className="fas fa-calendar-alt me-1"></i>Post will be published automatically at this time (UTC)</small>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-bold">Featured Image</label>
              <div className="border rounded p-3">
                {postForm.image && (
                  <div className="mb-3">
                    <img src={postForm.image.startsWith('http') ? postForm.image : `http://localhost:5000${postForm.image}`} alt="Featured" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    <button type="button" className="btn btn-sm btn-danger mt-2" onClick={() => setPostForm({...postForm, image: ''})}>Remove Image</button>
                  </div>
                )}
                <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                {uploadingImage && <div className="mt-2 text-primary"><span className="spinner-border spinner-border-sm me-1"></span>Uploading...</div>}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Content *</label>
              <RichTextEditor key={editorKey} value={postForm.content} onChange={(content) => setPostForm({...postForm, content})} />
            </div>
          </form>
        </div>
        <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: 'white', zIndex: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={isUpdating || isCreating}>Cancel</button>
          <button type="submit" form="postForm" className="btn btn-success" disabled={isUpdating || isCreating}>
            {(isUpdating || isCreating) ? <><span className="spinner-border spinner-border-sm me-2"></span>{editingPost ? 'Updating...' : 'Creating...'}</> : <><i className="fas fa-save me-1"></i>{editingPost ? 'Update Post' : 'Create Post'}</>}
          </button>
        </div>
      </div>
    </div>
  );
});

function AdminPanel({ isSuperAdmin, currentUserId }) {
  useDocumentTitle('Dashboard', 'RootNetwork');
  const navigate = useNavigate();
  
  // Data states
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [activeTab, setActiveTab] = useState('posts');
  const [commentFilter, setCommentFilter] = useState('all');
  const [postStatusFilter, setPostStatusFilter] = useState('all');
  const [newCategory, setNewCategory] = useState('');
  const [newTrendingHeadline, setNewTrendingHeadline] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({ 
    title: '', 
    content: '', 
    category_id: '', 
    image: '',
    status: 'draft',
    scheduled_for: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Category limit state
  const [categoryLimit, setCategoryLimit] = useState({ max: 5, current: 0, can_add: true, remaining: 5 });
  const [addingCategory, setAddingCategory] = useState(false);
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    is_super_admin: false,
    is_active: true
  });

  // Stable editor key
  const editorKey = useMemo(() => {
    if (editingPost) return `edit-${editingPost.id}`;
    if (showCreateForm) return 'new-post';
    return null;
  }, [editingPost?.id, showCreateForm]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
    if (isSuperAdmin) {
      loadUsers();
      fetchTrendingNews();
      fetchCategoryLimit();
    }
  }, [commentFilter, postStatusFilter]);

  const fetchCategoryLimit = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/categories/limit', { withCredentials: true });
      setCategoryLimit(response.data);
    } catch (error) {
      console.error('Failed to fetch category limit:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, commentsRes, categoriesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/posts?status=${postStatusFilter}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/admin/comments?filter=${commentFilter}`, { withCredentials: true }),
        axios.get('http://localhost:5000/api/admin/categories', { withCredentials: true })
      ]);
      
      setPosts(postsRes.data.posts || postsRes.data || []);
      setComments(commentsRes.data.comments || commentsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', { withCredentials: true });
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  // Trending News Functions
  const fetchTrendingNews = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/trending', { withCredentials: true });
      setTrendingNews(response.data);
    } catch (error) {
      console.error('Failed to fetch trending news:', error);
    }
  };

  const handleCreateTrending = async (e) => {
    e.preventDefault();
    if (!newTrendingHeadline.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/admin/trending', { headline: newTrendingHeadline }, { withCredentials: true });
      toast.success('Trending news added! It will expire in 12 hours.');
      setNewTrendingHeadline('');
      fetchTrendingNews();
    } catch (error) {
      toast.error('Failed to add trending news');
    }
  };

  const handleDeleteTrending = async (id) => {
    if (window.confirm('Delete this trending news?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/trending/${id}`, { withCredentials: true });
        toast.success('Trending news deleted');
        fetchTrendingNews();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  // User Management Functions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email || !userForm.username || !userForm.password) {
      toast.error('Email, username and password are required');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/admin/users', userForm, { withCredentials: true });
      toast.success('User created successfully. Welcome email sent.');
      setShowUserModal(false);
      setUserForm({ email: '', username: '', full_name: '', password: '', is_super_admin: false, is_active: true });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, userForm, { withCredentials: true });
      toast.success('User updated successfully');
      setEditingUser(null);
      setUserForm({ email: '', username: '', full_name: '', password: '', is_super_admin: false, is_active: true });
      setShowUserModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, username, isSuperAdminUser) => {
    if (isSuperAdminUser) {
      toast.error('Cannot delete a super admin account');
      return;
    }
    if (userId === currentUserId) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (window.confirm(`Delete user "${username}"?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, { withCredentials: true });
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  // Image Upload Function
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
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const response = await axios.post('http://localhost:5000/api/upload-post-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setPostForm({ ...postForm, image: response.data.image_url });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload image', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Post Management Functions
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (isCreating) {
      toast.warning('Please wait, post is still being created...');
      return;
    }
    if (!postForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!postForm.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (postForm.status === 'scheduled' && !postForm.scheduled_for) {
      toast.error('Please select a date and time for scheduled post');
      return;
    }
    setIsCreating(true);
    try {
      await axios.post('http://localhost:5000/api/admin/posts', postForm, { withCredentials: true });
      toast.success('Post created successfully!');
      setPostForm({ title: '', content: '', category_id: '', image: '', status: 'draft', scheduled_for: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (isUpdating) {
      toast.warning('Please wait, post is still being updated...');
      return;
    }
    if (!postForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!postForm.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (postForm.status === 'scheduled' && !postForm.scheduled_for) {
      toast.error('Please select a date and time for scheduled post');
      return;
    }
    setIsUpdating(true);
    try {
      await axios.put(`http://localhost:5000/api/admin/posts/${editingPost.id}`, postForm, { withCredentials: true });
      toast.success('Post updated successfully!');
      setEditingPost(null);
      setPostForm({ title: '', content: '', category_id: '', image: '', status: 'draft', scheduled_for: '' });
      loadData();
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this post?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/posts/${postId}`, { withCredentials: true });
        toast.success('Post deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  // Comment Management Functions
  const handleApproveComment = async (commentId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/comments/${commentId}/approve`, {}, { withCredentials: true });
      toast.success('Comment approved');
      loadData();
    } catch (error) {
      toast.error('Failed to approve comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/comments/${commentId}`, { withCredentials: true });
        toast.success('Comment deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  // Category Management Functions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    setAddingCategory(true);
    try {
      await axios.post('http://localhost:5000/api/admin/categories', { name: newCategory }, { withCredentials: true });
      toast.success('Category created successfully!');
      setNewCategory('');
      loadData();
      fetchCategoryLimit();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create category';
      toast.error(errorMsg);
      if (errorMsg.includes('Maximum')) fetchCategoryLimit();
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Delete this category?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/categories/${categoryId}`, { withCredentials: true });
        toast.success('Category deleted successfully');
        loadData();
        fetchCategoryLimit();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const startEditPost = async (post) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/posts/${post.slug}`, { withCredentials: true });
      const fullPost = response.data;
      setEditingPost(fullPost);
      setPostForm({
        title: fullPost.title,
        content: fullPost.content,
        category_id: fullPost.category_id || '',
        image: fullPost.image || '',
        status: fullPost.status || 'draft',
        scheduled_for: fullPost.scheduled_for || ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to fetch post for edit:', error);
      toast.error('Failed to load post data');
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setPostForm({ title: '', content: '', category_id: '', image: '', status: 'draft', scheduled_for: '' });
    setShowCreateForm(false);
    setIsUpdating(false);
    setIsCreating(false);
  };

  // Render functions for tabs
  const renderPostsTab = () => (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button className="btn btn-success" onClick={() => setShowCreateForm(true)}>
          <i className="fas fa-plus me-1"></i> Create New Post
        </button>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" style={{ width: '150px' }} value={postStatusFilter} onChange={(e) => setPostStatusFilter(e.target.value)}>
            <option value="all">All Posts</option>
            <option value="published">✅ Published</option>
            <option value="draft">📝 Drafts</option>
            <option value="scheduled">📅 Scheduled</option>
          </select>
        </div>
      </div>
      <DataTable
        data={posts}
        title={isSuperAdmin ? 'All Posts' : 'My Posts'}
        searchFields={['title', 'category', 'author_name']}
        exportFilename="posts_export"
        pagination={true}
        itemsPerPage={10}
        columns={[
          { field: 'title', header: 'Title', sortable: true, searchable: true },
          { field: 'category', header: 'Category', sortable: true, searchable: true },
          { field: 'comment_count', header: 'Comments', sortable: true },
          { field: 'status', header: 'Status', sortable: true, type: 'badge',
            format: (val) => val === 'published' ? 'Published' : val === 'draft' ? 'Draft' : 'Scheduled',
            badgeClass: (val) => val === 'published' ? 'bg-success' : val === 'draft' ? 'bg-warning text-dark' : 'bg-info'
          },
          ...(isSuperAdmin ? [{ field: 'author_name', header: 'Author', sortable: true, searchable: true }] : []),
          { field: 'timestamp', header: 'Date', sortable: true, type: 'date' },
          { field: 'id', header: 'Actions', type: 'actions', sortable: false }
        ]}
        actions={(row) => (
          <div className="d-flex gap-2">
            <button className="btn btn-warning btn-sm" onClick={() => startEditPost(row)}>
              <i className="fas fa-edit me-1"></i> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(row.id)}>
              <i className="fas fa-trash me-1"></i> Delete
            </button>
          </div>
        )}
      />
    </>
  );

  const renderCommentsTab = () => (
    <DataTable
      data={comments}
      title="Manage Comments"
      searchFields={['author', 'content', 'post_title']}
      exportFilename="comments_export"
      pagination={true}
      itemsPerPage={10}
      columns={[
        { field: 'author', header: 'Author', sortable: true, searchable: true },
        { field: 'content', header: 'Comment', sortable: false },
        { field: 'post_title', header: 'Post', sortable: true, searchable: true },
        { field: 'reviewed', header: 'Status', sortable: true, type: 'badge',
          format: (val) => val ? 'Approved' : 'Pending',
          badgeClass: (val) => val ? 'bg-success' : 'bg-warning'
        },
        { field: 'timestamp', header: 'Date', sortable: true, type: 'date' },
        { field: 'id', header: 'Actions', type: 'actions', sortable: false }
      ]}
      actions={(row) => (
        <div className="d-flex gap-2">
          {!row.reviewed && isSuperAdmin && (
            <button className="btn btn-success btn-sm" onClick={() => handleApproveComment(row.id)}>
              <i className="fas fa-check me-1"></i> Approve
            </button>
          )}
          {(isSuperAdmin || row.post_author_id === currentUserId) && (
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(row.id)}>
              <i className="fas fa-trash me-1"></i> Delete
            </button>
          )}
        </div>
      )}
    />
  );

  const renderCategoriesTab = () => (
    <>
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Add New Category</h5>
            <span className={`badge ${categoryLimit.can_add ? 'bg-success' : 'bg-danger'} fs-6`}>
              {categoryLimit.current} / {categoryLimit.max} Categories
            </span>
          </div>
          <div className="progress mb-3" style={{ height: '8px' }}>
            <div className={`progress-bar ${categoryLimit.can_add ? 'bg-success' : 'bg-danger'}`} style={{ width: `${(categoryLimit.current / categoryLimit.max) * 100}%` }}></div>
          </div>
          {!categoryLimit.can_add && (
            <div className="alert alert-warning mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Maximum of {categoryLimit.max} categories reached. Delete an existing category to add a new one.
            </div>
          )}
          {categoryLimit.can_add && categoryLimit.remaining > 0 && (
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              You can add {categoryLimit.remaining} more categor{categoryLimit.remaining === 1 ? 'y' : 'ies'}. Categories appear in the navigation bar.
            </div>
          )}
          <form onSubmit={handleCreateCategory} className="d-flex gap-2">
            <input type="text" className="form-control" placeholder="New Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required disabled={!categoryLimit.can_add || addingCategory} />
            <button type="submit" className="btn btn-primary" disabled={!categoryLimit.can_add || addingCategory}>
              {addingCategory ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-plus me-1"></i>}
              Add Category
            </button>
          </form>
        </div>
      </div>
      <DataTable
        data={categories}
        title="Categories"
        searchFields={['name']}
        exportFilename="categories_export"
        pagination={true}
        itemsPerPage={10}
        columns={[
          { field: 'name', header: 'Name', sortable: true, searchable: true },
          { field: 'post_count', header: 'Post Count', sortable: true },
          { field: 'id', header: 'Actions', type: 'actions', sortable: false }
        ]}
        actions={(row) => (
          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(row.id)} disabled={categories.length <= 1}
            title={categories.length <= 1 ? "Cannot delete the last category" : "Delete Category"}>
            <i className="fas fa-trash me-1"></i> Delete Category
          </button>
        )}
      />
      {categories.length === 0 && (
        <div className="alert alert-warning text-center mt-3">
          <i className="fas fa-exclamation-circle me-2"></i>
          No categories yet. Add your first category above. Categories will appear in the navigation bar.
        </div>
      )}
    </>
  );

  const renderUsersTab = () => (
    <>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setUserForm({ email: '', username: '', full_name: '', password: '', is_super_admin: false, is_active: true }); setShowUserModal(true); }}>
          <i className="fas fa-user-plus me-1"></i> Add User
        </button>
      </div>
      <DataTable
        data={users}
        title="User Management"
        searchFields={['username', 'email', 'full_name']}
        exportFilename="users_export"
        pagination={true}
        itemsPerPage={10}
        columns={[
          { field: 'username', header: 'Username', sortable: true, searchable: true },
          { field: 'email', header: 'Email', sortable: true, searchable: true },
          { field: 'full_name', header: 'Full Name', sortable: true, searchable: true },
          { field: 'is_super_admin', header: 'Role', sortable: true, type: 'badge',
            format: (val) => val ? 'Super Admin' : 'User',
            badgeClass: (val) => val ? 'bg-danger' : 'bg-info'
          },
          { field: 'is_active', header: 'Status', sortable: true, type: 'badge',
            format: (val) => val ? 'Active' : 'Inactive',
            badgeClass: (val) => val ? 'bg-success' : 'bg-secondary'
          },
          { field: 'post_count', header: 'Posts', sortable: true },
          { field: 'id', header: 'Actions', type: 'actions', sortable: false }
        ]}
        actions={(row) => (
          <div className="d-flex gap-2">
            <button className="btn btn-warning btn-sm" onClick={() => { setEditingUser(row); setUserForm({ email: row.email, username: row.username, full_name: row.full_name || '', password: '', is_super_admin: row.is_super_admin, is_active: row.is_active }); setShowUserModal(true); }}>
              <i className="fas fa-edit me-1"></i> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(row.id, row.username, row.is_super_admin)} disabled={row.id === currentUserId || row.is_super_admin}>
              <i className="fas fa-trash me-1"></i> Delete
            </button>
          </div>
        )}
      />
    </>
  );

  const renderTrendingTab = () => (
    <div className="card">
      <div className="card-body">
        <h4><i className="fas fa-fire text-danger me-2"></i> Trending News Management</h4>
        <p className="text-muted small mb-3">Trending news automatically expires after 12 hours.</p>
        <form onSubmit={handleCreateTrending} className="d-flex gap-2 mb-4">
          <input type="text" className="form-control form-control-lg" placeholder="Enter trending headline..." value={newTrendingHeadline} onChange={(e) => setNewTrendingHeadline(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-lg"><i className="fas fa-plus me-1"></i> Add Headline</button>
        </form>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Headline</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trendingNews.map(news => {
                const isExpired = new Date(news.expires_at) < new Date();
                const isActive = news.is_active && !isExpired;
                return (
                  <tr key={news.id} className={!isActive ? 'table-secondary' : ''}>
                    <td><i className={`fas fa-fire ${isActive ? 'text-danger' : 'text-muted'} me-2`}></i>{news.headline}</td>
                    <td><span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>{isActive ? 'Active' : 'Expired'}</span></td>
                    <td><small>{new Date(news.created_at).toLocaleString()}</small></td>
                    <td><small className={isExpired ? 'text-danger' : 'text-muted'}>{new Date(news.expires_at).toLocaleString()}</small></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteTrending(news.id)}><i className="fas fa-trash me-1"></i> Delete</button></td>
                  </tr>
                );
              })}
              {trendingNews.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    <i className="fas fa-fire fa-2x mb-2 d-block"></i>
                    No trending news. Add some headlines to display in the topbar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div>
      {isSuperAdmin && (
        <div className="mb-3 d-flex gap-2 flex-wrap">
          <button className="btn btn-danger" onClick={() => navigate('/admin/security')}><i className="fas fa-shield-alt me-1"></i> Security Dashboard</button>
          <button className="btn btn-info" onClick={() => navigate('/admin/analytics')}><i className="fas fa-chart-line me-1"></i> View Analytics</button>
        </div>
      )}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}><i className="fas fa-file-alt me-1"></i> Posts ({posts.length})</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}><i className="fas fa-comments me-1"></i> Comments ({comments.length})</button></li>
        {isSuperAdmin && (
          <>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'trending' ? 'active' : ''}`} onClick={() => setActiveTab('trending')}><i className="fas fa-fire me-1 text-danger"></i> Trending ({trendingNews.length})</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><i className="fas fa-tags me-1"></i> Categories ({categories.length})</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><i className="fas fa-users me-1"></i> Users ({users.length})</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'rate-limits' ? 'active' : ''}`} onClick={() => setActiveTab('rate-limits')}><i className="fas fa-tachometer-alt me-1"></i> Rate Limits</button></li>
          </>
        )}
      </ul>
      {activeTab === 'posts' && renderPostsTab()}
      {activeTab === 'comments' && renderCommentsTab()}
      {activeTab === 'trending' && isSuperAdmin && renderTrendingTab()}
      {activeTab === 'categories' && isSuperAdmin && renderCategoriesTab()}
      {activeTab === 'users' && isSuperAdmin && renderUsersTab()}
      {activeTab === 'rate-limits' && isSuperAdmin && <RateLimitDashboard isSuperAdmin={isSuperAdmin} />}
      
      {/* Memoized Post Modal */}
      <PostModal 
        showCreateForm={showCreateForm}
        editingPost={editingPost}
        postForm={postForm}
        setPostForm={setPostForm}
        categories={categories}
        handleImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
        handleUpdatePost={handleUpdatePost}
        handleCreatePost={handleCreatePost}
        cancelEdit={cancelEdit}
        isUpdating={isUpdating}
        isCreating={isCreating}
        editorKey={editorKey}
      />
      
      {showUserModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowUserModal(false); }}>
          <div className="modal-content" style={{ width: '500px', maxWidth: '90%' }}>
            <div className="modal-header"><h3 className="mb-0">{editingUser ? 'Edit User' : 'Create New User'}</h3><button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button></div>
            <div className="modal-body">
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} id="userForm">
                <div className="mb-3"><label className="form-label">Email *</label><input type="email" className="form-control" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} required /></div>
                <div className="mb-3"><label className="form-label">Username *</label><input type="text" className="form-control" value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} required /></div>
                <div className="mb-3"><label className="form-label">Full Name</label><input type="text" className="form-control" value={userForm.full_name} onChange={(e) => setUserForm({...userForm, full_name: e.target.value})} /></div>
                <div className="mb-3"><label className="form-label">{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label><input type="password" className="form-control" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required={!editingUser} /></div>
                <div className="mb-3 form-check"><input type="checkbox" className="form-check-input" id="isSuperAdmin" checked={userForm.is_super_admin} onChange={(e) => setUserForm({...userForm, is_super_admin: e.target.checked})} disabled={editingUser?.id === currentUserId} /><label className="form-check-label" htmlFor="isSuperAdmin">Super Admin (full access)</label></div>
                <div className="mb-3 form-check"><input type="checkbox" className="form-check-input" id="isActive" checked={userForm.is_active} onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})} disabled={editingUser?.id === currentUserId} /><label className="form-check-label" htmlFor="isActive">Active Account</label></div>
              </form>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button><button type="submit" form="userForm" className="btn btn-primary"><i className="fas fa-save me-1"></i> {editingUser ? 'Update User' : 'Create User'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
// frontend/src/components/BlogPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';

function BlogPage({ isLoggedIn }) {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage] = useState(6);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  // Set document title based on selected category
  const pageTitle = selectedCategoryName ? `${selectedCategoryName} News` : 'Latest News';
  useDocumentTitle(pageTitle, 'RootNetwork');

  // Load categories first, then set selected category from URL
  useEffect(() => {
    fetchCategories();
  }, []);

  // When categories load or categorySlug changes, set selected category
  useEffect(() => {
    if (categories.length > 0 && categorySlug) {
      const categoryName = categorySlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const category = categories.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (category) {
        setSelectedCategory(category.id);
        setSelectedCategoryName(category.name);
        setCurrentPage(1);
      } else {
        setSelectedCategory(null);
        setSelectedCategoryName(null);
      }
    } else if (!categorySlug) {
      setSelectedCategory(null);
      setSelectedCategoryName(null);
    }
  }, [categories, categorySlug]);

  // Fetch posts when category or page changes
  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, currentPage]);

  // Fetch featured post (only when no category is selected)
  useEffect(() => {
    if (!selectedCategory) {
      fetchFeaturedPost();
    } else {
      setFeaturedPost(null);
    }
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: postsPerPage
      });
      
      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }
      
      const url = `http://localhost:5000/api/posts?${params.toString()}`;
      const response = await axios.get(url);
      
      setPosts(response.data.posts || []);
      setTotalPages(response.data.pages || 1);
      setTotalPosts(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedPost = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts?page=1&per_page=1');
      if (response.data.posts && response.data.posts.length > 0) {
        setFeaturedPost(response.data.posts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch featured post', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handlePostClick = (slug) => {
    navigate(`/blog/post/${slug}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryId, categoryName) => {
    if (categoryId === null) {
      navigate('/blog');
      setSelectedCategory(null);
      setSelectedCategoryName(null);
      setCurrentPage(1);
    } else {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      navigate(`/category/${slug}`);
    }
  };

  const clearFilter = () => {
    navigate('/blog');
    setSelectedCategory(null);
    setSelectedCategoryName(null);
    setCurrentPage(1);
  };

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    setSubscribing(true);
    setNewsletterStatus(null);
    
    try {
      // If you have a newsletter endpoint
      // await axios.post('http://localhost:5000/api/subscribe', { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', message: 'Subscribed successfully! Check your email.' });
      setNewsletterEmail('');
      
      setTimeout(() => {
        setNewsletterStatus(null);
      }, 5000);
    } catch (error) {
      setNewsletterStatus({ type: 'error', message: 'Failed to subscribe. Please try again.' });
    } finally {
      setSubscribing(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Featured Post - Shows only when no category is selected */}
      {featuredPost && !selectedCategory && (
        <div className="row g-5 border-bottom pb-5 mb-5">
          <div className="col-md-6 mb-4">
            <div className="card overflow-hidden border-0 shadow rounded-4" style={{ cursor: 'pointer' }} onClick={() => handlePostClick(featuredPost.slug)}>
              <img
                src={getImageUrl(featuredPost.image) || "https://mdbcdn.b-cdn.net/img/new/slides/080.webp"}
                className="card-img-top"
                alt={featuredPost.title}
                style={{ height: '300px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "https://mdbcdn.b-cdn.net/img/new/slides/080.webp";
                }}
              />
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <span className="badge bg-danger px-3 py-2 mb-3 rounded-pill">
              {featuredPost.category?.name || 'Featured Post'}
            </span>
            <h2 className="fw-bold mb-3">{featuredPost.title}</h2>
            <p className="text-muted">
              {featuredPost.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
            <div className="text-muted small mb-3">
              <i className="far fa-calendar-alt me-2"></i>
              {new Date(featuredPost.timestamp).toLocaleDateString()}
              <i className="far fa-comment ms-3 me-2"></i>
              {featuredPost.comment_count} comments
            </div>
            <button className="btn btn-dark rounded-pill" onClick={() => handlePostClick(featuredPost.slug)}>
              Read More →
            </button>
          </div>
        </div>
      )}

      {/* Show message when category is selected */}
      {selectedCategoryName && (
        <div className="alert alert-info mb-4">
          <i className="fas fa-filter me-2"></i>
          Browsing category: <strong>{selectedCategoryName}</strong>
          <button 
            className="btn btn-sm btn-outline-secondary ms-3"
            onClick={clearFilter}
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="row g-5">
        {/* Main Content */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold">
              <i className="fas fa-newspaper me-2"></i>
              {selectedCategoryName ? `${selectedCategoryName} Posts` : 'Latest Posts'}
            </h3>
            <div>
              {selectedCategoryName && (
                <span className="badge bg-dark rounded-pill me-2">
                  {selectedCategoryName}
                </span>
              )}
              <span className="text-muted small">
                Total: {totalPosts} posts
              </span>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="alert alert-info text-center">
              <i className="fas fa-info-circle me-2"></i>
              No posts found in this category.
            </div>
          ) : (
            <div className="row">
              {posts.map((post, index) => (
                <div className="col-md-6 mb-4" key={post.id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-img-top overflow-hidden" style={{ height: '200px', cursor: 'pointer' }} onClick={() => handlePostClick(post.slug)}>
                      <img
                        src={getImageUrl(post.image) || (index % 2 === 0 
                          ? "https://mdbcdn.b-cdn.net/img/new/standard/city/041.webp"
                          : "https://mdbcdn.b-cdn.net/img/new/standard/city/042.webp")}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        alt={post.title}
                        onError={(e) => {
                          e.target.src = index % 2 === 0 
                            ? "https://mdbcdn.b-cdn.net/img/new/standard/city/041.webp"
                            : "https://mdbcdn.b-cdn.net/img/new/standard/city/042.webp";
                        }}
                      />
                    </div>
                    <div className="card-body">
                      {post.category && (
                        <span className={`badge ${index % 2 === 0 ? 'bg-info' : 'bg-danger'} rounded-pill mb-3`}>
                          <i className={`fas ${index % 2 === 0 ? 'fa-plane' : 'fa-chart-pie'} me-1`}></i>
                          {post.category.name}
                        </span>
                      )}
                      <h5 className="fw-bold">
                        <a href="#" className="text-dark text-decoration-none" onClick={() => handlePostClick(post.slug)}>
                          {post.title}
                        </a>
                      </h5>
                      <p className="text-muted small">
                        {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                      <div className="text-muted small">
                        <i className="far fa-calendar-alt me-2"></i>
                        {new Date(post.timestamp).toLocaleDateString()}
                        <i className="far fa-comment ms-3 me-2"></i>
                        {post.comment_count} comments
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-5" aria-label="Blog pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left me-1"></i>
                    Previous
                  </button>
                </li>
                
                {getPageNumbers()[0] > 1 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                    </li>
                    {getPageNumbers()[0] > 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}
                
                {getPageNumbers().map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </button>
                    </li>
                  </>
                )}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
          
          {totalPages > 1 && (
            <div className="text-center mt-3">
              <small className="text-muted">
                Page {currentPage} of {totalPages} ({totalPosts} total posts)
              </small>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Categories */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-folder me-2"></i>
                Categories
              </h5>
              <div className="list-group">
                <button
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(null, null)}
                >
                  All Posts
                  <span className="badge bg-secondary rounded-pill">{totalPosts}</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat.id, cat.name)}
                  >
                    {cat.name}
                    <span className="badge bg-secondary rounded-pill">{cat.post_count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter Subscribe Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-dark text-white rounded-top-4">
              <h5 className="mb-0"><i className="fas fa-envelope me-2"></i> Subscribe</h5>
            </div>
            <div className="card-body text-center">
              <p className="text-muted small">Get the latest posts delivered to your inbox</p>
              <form onSubmit={handleNewsletterSubscribe}>
                <div className="mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Subscribe
                    </>
                  )}
                </button>
              </form>
              {newsletterStatus && (
                <div className={`alert alert-${newsletterStatus.type === 'success' ? 'success' : 'danger'} mt-3 mb-0 py-2 small`}>
                  {newsletterStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-clock me-2"></i>
                Recent Posts
              </h5>
              {posts.slice(0, 4).map((post, idx) => (
                <div key={post.id} className="d-flex mb-3 pb-2 border-bottom" style={{ cursor: 'pointer' }} onClick={() => handlePostClick(post.slug)}>
                  <img
                    src={getImageUrl(post.image) || (idx === 0 
                      ? "https://mdbcdn.b-cdn.net/img/new/standard/city/031.webp"
                      : "https://mdbcdn.b-cdn.net/img/new/standard/city/032.webp")}
                    className="rounded me-3"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    alt={post.title}
                    onError={(e) => {
                      e.target.src = idx === 0 
                        ? "https://mdbcdn.b-cdn.net/img/new/standard/city/031.webp"
                        : "https://mdbcdn.b-cdn.net/img/new/standard/city/032.webp";
                    }}
                  />
                  <div>
                    <h6 className="mb-1 fw-bold">{post.title.substring(0, 50)}...</h6>
                    <small className="text-muted">
                      <i className="far fa-calendar-alt me-1"></i>
                      {new Date(post.timestamp).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogPage;
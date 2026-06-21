// frontend/src/components/BlogPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config';

function BlogPage({ isLoggedIn }) {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const postsPerPage = 6;

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const pageTitle = selectedCategoryName ? `${selectedCategoryName} News` : 'Latest News';
  useDocumentTitle(pageTitle, 'RootNetwork');

  // ---- Fetch categories ----
  useEffect(() => {
    fetchCategories();
  }, []);

  // ---- Handle category change from URL ----
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
        resetAndFetch();
      } else {
        setSelectedCategory(null);
        setSelectedCategoryName(null);
        resetAndFetch();
      }
    } else if (!categorySlug) {
      setSelectedCategory(null);
      setSelectedCategoryName(null);
      resetAndFetch();
    }
  }, [categories, categorySlug]);

  // ---- Reset and fetch first page ----
  const resetAndFetch = () => {
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setInitialLoadDone(false);
    fetchPosts(1, true);
  };

  // ---- Fetch featured post (only when no category) ----
  useEffect(() => {
    if (!selectedCategory) {
      fetchFeaturedPost();
    } else {
      setFeaturedPost(null);
    }
  }, [selectedCategory]);

  // ---- Fetch posts with pagination (append or replace) ----
  const fetchPosts = async (page, replace = false) => {
    if (page > totalPages && totalPages > 0) {
      setHasMore(false);
      return;
    }

    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: page,
        per_page: postsPerPage
      });
      
      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }
      
      const url = `${API_URL}/api/posts?${params.toString()}`;
      const response = await axios.get(url, { withCredentials: true });
      
      const newPosts = response.data.posts || [];
      const total = response.data.total || 0;
      const pages = response.data.pages || 1;

      setTotalPosts(total);
      setTotalPages(pages);
      setHasMore(page < pages);

      if (replace) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ---- Featured post fetch ----
  const fetchFeaturedPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts?page=1&per_page=1`, {
        withCredentials: true
      });
      if (response.data.posts && response.data.posts.length > 0) {
        setFeaturedPost(response.data.posts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch featured post', error);
    }
  };

  // ---- Categories fetch ----
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`, {
        withCredentials: true
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  // ---- IntersectionObserver for infinite scroll ----
  useEffect(() => {
    if (loading || !hasMore || loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = currentPage + 1;
          if (nextPage <= totalPages) {
            fetchPosts(nextPage, false);
          } else {
            setHasMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, currentPage, totalPages]);

  // ---- Initial load ----
  useEffect(() => {
    if (!initialLoadDone && !loading) {
      // Initial load already triggered by resetAndFetch
      setInitialLoadDone(true);
    }
  }, [loading, initialLoadDone]);

  // ---- Helpers ----
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handlePostClick = (slug) => {
    navigate(`/blog/post/${slug}`);
  };

  const handleCategorySelect = (categoryId, categoryName) => {
    if (categoryId === null) {
      navigate('/blog');
      setSelectedCategory(null);
      setSelectedCategoryName(null);
      resetAndFetch();
    } else {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      navigate(`/category/${slug}`);
    }
  };

  const clearFilter = () => {
    navigate('/blog');
    setSelectedCategory(null);
    setSelectedCategoryName(null);
    resetAndFetch();
  };

  if (loading && posts.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: '#07255b' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Featured Post */}
      {featuredPost && !selectedCategory && (
        <div className="row g-5 border-bottom pb-5 mb-5">
          <div className="col-md-6 mb-4">
            <div 
              className="card overflow-hidden border-0 shadow rounded-4" 
              style={{ cursor: 'pointer' }} 
              onClick={() => handlePostClick(featuredPost.slug)}
            >
              <img
                src={getImageUrl(featuredPost.image) || "https://mdbcdn.b-cdn.net/img/new/slides/080.webp"}
                className="card-img-top lazy-image"
                alt={featuredPost.title}
                loading="lazy"
                style={{ height: '300px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "https://mdbcdn.b-cdn.net/img/new/slides/080.webp";
                }}
              />
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <span className="badge px-3 py-2 mb-3 rounded-pill" style={{ backgroundColor: '#07255b' }}>
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
            <button 
              className="btn rounded-pill text-white" 
              style={{ backgroundColor: '#07255b', border: 'none' }}
              onClick={() => handlePostClick(featuredPost.slug)}
            >
              Read More →
            </button>
          </div>
        </div>
      )}

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
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold" style={{ color: '#07255b' }}>
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
                    <div 
                      className="card-img-top overflow-hidden" 
                      style={{ height: '200px', cursor: 'pointer' }} 
                      onClick={() => handlePostClick(post.slug)}
                    >
                      <img
                        src={getImageUrl(post.image) || (index % 2 === 0 
                          ? "https://mdbcdn.b-cdn.net/img/new/standard/city/041.webp"
                          : "https://mdbcdn.b-cdn.net/img/new/standard/city/042.webp")}
                        className="w-100 h-100 lazy-image"
                        style={{ objectFit: 'cover' }}
                        alt={post.title}
                        loading="lazy"
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

          {/* Infinite Scroll Sentinel */}
          {hasMore && posts.length > 0 && (
            <div ref={sentinelRef} className="text-center py-4">
              {loadingMore ? (
                <div className="spinner-border" style={{ color: '#07255b', width: '2rem', height: '2rem' }} role="status">
                  <span className="visually-hidden">Loading more...</span>
                </div>
              ) : (
                <span className="text-muted small">Scroll for more</span>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4">
              <small className="text-muted">You've reached the end 🎉</small>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3" style={{ color: '#07255b' }}>
                <i className="fas fa-folder me-2"></i>
                Categories
              </h5>
              <div className="list-group">
                <button
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${!selectedCategory ? 'active' : ''}`}
                  style={!selectedCategory ? { backgroundColor: '#07255b', borderColor: '#07255b' } : {}}
                  onClick={() => handleCategorySelect(null, null)}
                >
                  All Posts
                  <span className="badge bg-secondary rounded-pill">{totalPosts}</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedCategory === cat.id ? 'active' : ''}`}
                    style={selectedCategory === cat.id ? { backgroundColor: '#07255b', borderColor: '#07255b' } : {}}
                    onClick={() => handleCategorySelect(cat.id, cat.name)}
                  >
                    {cat.name}
                    <span className="badge bg-secondary rounded-pill">{cat.post_count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3" style={{ color: '#07255b' }}>
                <i className="fas fa-clock me-2"></i>
                Recent Posts
              </h5>
              {posts.slice(0, 4).map((post, idx) => (
                <div key={post.id} className="d-flex mb-3 pb-2 border-bottom" style={{ cursor: 'pointer' }} onClick={() => handlePostClick(post.slug)}>
                  <img
                    src={getImageUrl(post.image) || (idx === 0 
                      ? "https://mdbcdn.b-cdn.net/img/new/standard/city/031.webp"
                      : "https://mdbcdn.b-cdn.net/img/new/standard/city/032.webp")}
                    className="rounded me-3 lazy-image"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    alt={post.title}
                    loading="lazy"
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

      <style>{`
        .lazy-image {
          opacity: 0;
          animation: fadeIn 0.6s ease-in forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .lazy-image:not([loaded]) {
          background: #f0f0f0;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite, fadeIn 0.6s ease-in forwards;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default BlogPage;

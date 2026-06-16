// frontend/src/pages/HomePage.js - Clean Professional Layout (No Travel, No Category Counts)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import tracking from '../utils/tracking';
import useDocumentTitle from '../hooks/useDocumentTitle';

function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [entertainmentPosts, setEntertainmentPosts] = useState([]);
  const [businessPosts, setBusinessPosts] = useState([]);
  const [lifeStylePosts, setLifeStylePosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set document title
  useDocumentTitle('Home', 'RootNetwork');

  useEffect(() => {
    fetchHomeData();
    tracking.trackPageView('home');
  }, []);

  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const getPlainTextPreview = (html, maxLength = 100) => {
    const plainText = stripHtml(html);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        axios.get('${API_URL}/api/posts?page=1&per_page=30', { withCredentials: true }),
        axios.get('${API_URL}/api/categories', { withCredentials: true })
      ]);
      
      const allPosts = postsRes.data.posts || [];
      setFeaturedPosts(allPosts.slice(0, 3));
      setLatestPosts(allPosts.slice(0, 8));
      
      const entertainment = allPosts.filter(p => 
        p.category?.name?.toLowerCase().includes('entertain') || 
        p.category?.name?.toLowerCase().includes('music')
      );
      const business = allPosts.filter(p => 
        p.category?.name?.toLowerCase().includes('business') || 
        p.category?.name?.toLowerCase().includes('finance')
      );
      const lifestyle = allPosts.filter(p => 
        p.category?.name?.toLowerCase().includes('life') || 
        p.category?.name?.toLowerCase().includes('health') ||
        p.category?.name?.toLowerCase().includes('style')
      );
      
      setEntertainmentPosts(entertainment.slice(0, 4));
      setBusinessPosts(business.slice(0, 4));
      setLifeStylePosts(lifestyle.slice(0, 4));
      setPopularPosts(allPosts.slice(0, 5));
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
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
    <div className="home-page">
      {/* Hero Section */}
      {featuredPosts.length > 0 && (
        <div className="hero-section mb-5">
          <div className="row g-0">
            {featuredPosts.map((post, idx) => (
              <div className="col-md-4" key={post.id}>
                <Link to={`/blog/post/${post.slug}`} className="text-decoration-none">
                  <div className="hero-card position-relative" style={{ height: '450px', overflow: 'hidden' }}>
                    <img 
                      src={getImageUrl(post.image) || "https://placehold.co/800x600/1a1a2e/white?text=News"} 
                      alt={post.title}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="hero-overlay position-absolute bottom-0 start-0 end-0 p-4 text-white" 
                         style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                      <span className="badge bg-danger mb-2">{post.category?.name || 'News'}</span>
                      <h3 className="h5 mb-2">{post.title}</h3>
                      <small><i className="far fa-calendar-alt me-1"></i> {new Date(post.timestamp).toLocaleDateString()}</small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container">
        {/* Main Content Row */}
        <div className="row">
          {/* Left Column - Main Content */}
          <div className="col-lg-8">
            {/* Latest Posts Grid */}
            <section className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0 fw-bold">Latest Stories</h2>
                <Link to="/blog" className="text-danger text-decoration-none">View All →</Link>
              </div>
              <div className="row">
                {latestPosts.slice(0, 4).map((post) => (
                  <div className="col-md-6 mb-4" key={post.id}>
                    <div className="card h-100 border-0 shadow-sm hover-card">
                      {post.image && (
                        <img 
                          src={getImageUrl(post.image)} 
                          className="card-img-top" 
                          alt={post.title} 
                          style={{ height: '220px', objectFit: 'cover' }}
                        />
                      )}
                      <div className="card-body">
                        <span className="badge bg-primary mb-2 ">{post.category?.name || 'News'}</span>
                        <h5 className="card-title">
                          <Link to={`/blog/post/${post.slug}`} className="text-dark text-decoration-none">
                            {post.title}
                          </Link>
                        </h5>
                        <p className="card-text text-muted small">
                          {getPlainTextPreview(post.content, 100)}
                        </p>
                        <small className="text-muted">
                          <i className="far fa-calendar-alt me-1"></i> {new Date(post.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Entertainment Section */}
            {entertainmentPosts.length > 0 && (
              <section className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h5 fw-bold mb-0">🎬 Entertainment</h3>
                  <Link to="/category/entertainment" className="text-danger small">More →</Link>
                </div>
                <div className="row">
                  {entertainmentPosts.slice(0, 4).map(post => (
                    <div className="col-md-3 col-6 mb-3" key={post.id}>
                      <Link to={`/blog/post/${post.slug}`} className="text-decoration-none">
                        {post.image && (
                          <img 
                            src={getImageUrl(post.image)} 
                            className="w-100 rounded mb-2" 
                            alt={post.title} 
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                        )}
                        <h6 className="small text-dark mb-0">{post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}</h6>
                        <small className="text-muted">{new Date(post.timestamp).toLocaleDateString()}</small>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Business Section */}
            {businessPosts.length > 0 && (
              <section className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h5 fw-bold mb-0">💼 Business</h3>
                  <Link to="/category/business" className="text-danger small">More →</Link>
                </div>
                <div className="row">
                  {businessPosts.slice(0, 4).map(post => (
                    <div className="col-md-3 col-6 mb-3" key={post.id}>
                      <Link to={`/blog/post/${post.slug}`} className="text-decoration-none">
                        {post.image && (
                          <img 
                            src={getImageUrl(post.image)} 
                            className="w-100 rounded mb-2" 
                            alt={post.title} 
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                        )}
                        <h6 className="small text-dark mb-0">{post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}</h6>
                        <small className="text-muted">{new Date(post.timestamp).toLocaleDateString()}</small>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lifestyle Section */}
            {lifeStylePosts.length > 0 && (
              <section className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h5 fw-bold mb-0">✨ Lifestyle</h3>
                  <Link to="/category/lifestyle" className="text-danger small">More →</Link>
                </div>
                <div className="row">
                  {lifeStylePosts.slice(0, 4).map(post => (
                    <div className="col-md-3 col-6 mb-3" key={post.id}>
                      <Link to={`/blog/post/${post.slug}`} className="text-decoration-none">
                        {post.image && (
                          <img 
                            src={getImageUrl(post.image)} 
                            className="w-100 rounded mb-2" 
                            alt={post.title} 
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                        )}
                        <h6 className="small text-dark mb-0">{post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}</h6>
                        <small className="text-muted">{new Date(post.timestamp).toLocaleDateString()}</small>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* More Articles Button */}
            <div className="text-center my-5">
              <Link to="/blog" className="btn btn-outline-primary px-5 py-2 rounded-pill">
                Load More Articles <i className="fas fa-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="col-lg-4">
            <div className="position-sticky" style={{ top: '100px' }}>
              {/* Popular Posts */}
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0"><i className="fas fa-fire me-2"></i> Most Popular</h5>
                </div>
                <div className="card-body p-0">
                  {popularPosts.map((post, index) => (
                    <Link 
                      key={post.id}
                      to={`/blog/post/${post.slug}`}
                      className="d-flex align-items-center p-3 text-decoration-none border-bottom hover-bg"
                    >
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" 
                          style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                        {index + 1}
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-dark small fw-bold">{post.title}</div>
                        <small className="text-muted">{new Date(post.timestamp).toLocaleDateString()}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories - No post counts */}
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0"><i className="fas fa-folder me-2"></i> Categories</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {categories.map(cat => (
                      <div className="col-6 mb-2" key={cat.id}>
                        <Link 
                          to={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-dark text-decoration-none small"
                        >
                          <i className="fas fa-tag me-1 text-primary"></i> {cat.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="card border-0 bg-primary text-white">
                <div className="card-body text-center p-4">
                  <i className="fas fa-envelope-open-text fa-3x mb-3"></i>
                  <h5 className="fw-bold">Newsletter</h5>
                  <p className="small">Get the best stories delivered to your inbox</p>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Coming soon!'); }}>
                    <div className="mb-2">
                      <input type="email" className="form-control form-control-sm" placeholder="Your email" required />
                    </div>
                    <button type="submit" className="btn btn-light btn-sm w-100 fw-bold">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-card {
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        
        .hero-card:hover {
          transform: scale(1.02);
        }
        
        .hover-card {
          transition: all 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        
        .hover-bg:hover {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .hero-card {
            height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;

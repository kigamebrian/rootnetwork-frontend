// frontend/src/components/RelatedPosts.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function RelatedPosts({ postId, currentPostSlug }) {
  const navigate = useNavigate();
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchRelatedPosts();
    }
  }, [postId]);

  const fetchRelatedPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/posts/${postId}/related`);
      setRelatedPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch related posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle click and scroll to top
  const handleRelatedPostClick = (e, slug) => {
    e.preventDefault();
    
    // Scroll to top instantly
    window.scrollTo({
      top: 0,
      behavior: 'instant' // or 'smooth' for smooth scrolling
    });
    
    // Navigate to the post
    navigate(`/blog/post/${slug}`);
  };

  if (loading) {
    return (
      <div className="related-posts-skeleton mt-5 pt-4">
        <div className="border-top pt-4">
          <h4 className="mb-4">
            <i className="fas fa-link me-2 text-primary"></i>
            You Might Also Like
          </h4>
          <div className="row g-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="col-md-3 col-sm-6">
                <div className="skeleton-card" style={{ height: '200px' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  // Filter out current post if accidentally included
  const filteredPosts = relatedPosts.filter(post => post.slug !== currentPostSlug);

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <div className="related-posts mt-5 pt-4">
      <div className="border-top pt-4">
        <h4 className="mb-4">
          <i className="fas fa-link me-2 text-primary"></i>
          You Might Also Like
        </h4>
        <div className="row g-4">
          {filteredPosts.slice(0, 4).map(post => (
            <div className="col-md-3 col-sm-6" key={post.id}>
              <div 
                className="card h-100 shadow-sm hover-shadow transition-all border-0 rounded-3 overflow-hidden"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleRelatedPostClick(e, post.slug)}
              >
                {post.image && (
                  <div className="position-relative overflow-hidden" style={{ height: '160px' }}>
                    <img 
                      src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                      className="card-img-top w-100 h-100"
                      alt={post.title}
                      style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="card-body">
                  {post.category && post.category !== 'Uncategorized' && (
                    <small className="text-muted d-block mb-1">
                      <i className="fas fa-folder me-1"></i> {post.category}
                    </small>
                  )}
                  <h6 className="card-title mb-2">
                    <span 
                      className="text-decoration-none text-dark stretched-link"
                      style={{ fontWeight: 600 }}
                    >
                      {post.title.length > 60 ? post.title.substring(0, 60) + '...' : post.title}
                    </span>
                  </h6>
                  <small className="text-muted">
                    <i className="far fa-calendar-alt me-1"></i>
                    {new Date(post.timestamp).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hover-shadow {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -12px rgba(0, 0, 0, 0.2) !important;
        }
        .card:hover .card-img-top {
          transform: scale(1.08);
        }
        .skeleton-card {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .related-posts .card {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}

export default RelatedPosts;
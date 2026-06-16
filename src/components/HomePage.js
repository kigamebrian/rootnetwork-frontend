// frontend/src/components/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ adminData, setCurrentPage }) {
  const navigate = useNavigate();
  
  const handleExplore = () => {
    if (setCurrentPage) {
      setCurrentPage('blog');
    } else {
      navigate('/blog');
    }
  };
  
  return (
    <div className="home-content">
      <div className="hero-section text-center">
        <h1 className="display-3 fw-bold mb-3">{adminData?.blog_title || 'My Blog'}</h1>
        <p className="lead mb-4">{adminData?.blog_subtitle || 'Welcome to my personal blog'}</p>
        <button className="btn btn-primary btn-lg" onClick={handleExplore}>
          Explore Blog →
        </button>
      </div>
    </div>
  );
}

export default HomePage;
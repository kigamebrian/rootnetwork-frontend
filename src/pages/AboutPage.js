// frontend/src/pages/AboutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Import CSS from the same directory
//import './AboutPage.css';

function AboutPage() {
  useDocumentTitle('About Us', 'RootNetwork');
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200",
      alt: "Journalism",
      caption: "Independent Journalism"
    },
    {
      image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200",
      alt: "News reporting",
      caption: "Breaking News"
    },
    {
      image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200",
      alt: "Breaking news",
      caption: "Global Coverage"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="about-page">
      {/* Hero Section with Slider */}
      <div className="hero-container">
        <div className="hero-slider">
          <div className="hero-slides">
            {slides.map((slide, index) => (
              <div 
                key={index}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              >
                <img 
                  src={slide.image}
                  alt={slide.alt}
                  className="hero-image"
                />
                <div className="hero-overlay"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="hero-text-container">
          <h1 className="hero-heading">
            We believe accurate news<br />is essential to civil society
          </h1>
          <p className="hero-subheading">
            Delivering truth, integrity, and perspective since 2024
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/blog')}>
              Explore Stories
            </button>
            <button className="btn btn-outline-light btn-lg" onClick={() => navigate('/contact')}>
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container py-5">
        <div className="row align-items-center mb-5">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h2 className="section-title">Our Mission</h2>
            <p className="lead">
              To provide accurate, unbiased, and impactful journalism that empowers 
              citizens and strengthens democracy.
            </p>
            <p>
              In an era of misinformation, we stand committed to factual reporting, 
              deep investigative journalism, and stories that matter. Our team of 
              dedicated journalists works tirelessly to bring you the truth, 
              holding power accountable and giving voice to the voiceless.
            </p>
          </div>
          <div className="col-lg-6">
            <div className="stat-card-grid">
              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Stories Published</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50+</div>
                <div className="stat-label">Contributors</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Monthly Readers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="values-section py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5">Our Core Values</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="value-card">
                <div className="value-icon">
                  <i className="fas fa-balance-scale"></i>
                </div>
                <h4>Unbiased Reporting</h4>
                <p>We present facts without prejudice, letting the truth speak for itself across all perspectives.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="value-card">
                <div className="value-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h4>Investigative Depth</h4>
                <p>We go beyond headlines to uncover the full story, dedicating time to complex issues.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="value-card">
                <div className="value-icon">
                  <i className="fas fa-hand-holding-heart"></i>
                </div>
                <h4>Community Impact</h4>
                <p>We focus on stories that drive positive change and serve the public interest.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container py-5">
        <h2 className="section-title text-center mb-5">Meet Our Team</h2>
        <div className="row g-4">
          <div className="col-md-3 col-sm-6">
            <div className="team-card">
              <img 
                src="https://randomuser.me/api/portraits/women/68.jpg" 
                alt="Editor" 
                className="team-image"
              />
              <h5 className="team-name">Sarah Johnson</h5>
              <p className="team-role">Editor-in-Chief</p>
              <div className="team-social">
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-linkedin"></i></a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="team-card">
              <img 
                src="https://randomuser.me/api/portraits/men/32.jpg" 
                alt="Reporter" 
                className="team-image"
              />
              <h5 className="team-name">Michael Chen</h5>
              <p className="team-role">Senior Reporter</p>
              <div className="team-social">
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-linkedin"></i></a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="team-card">
              <img 
                src="https://randomuser.me/api/portraits/women/45.jpg" 
                alt="Photographer" 
                className="team-image"
              />
              <h5 className="team-name">Emma Rodriguez</h5>
              <p className="team-role">Photojournalist</p>
              <div className="team-social">
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="team-card">
              <img 
                src="https://randomuser.me/api/portraits/men/75.jpg" 
                alt="Analyst" 
                className="team-image"
              />
              <h5 className="team-name">David Kim</h5>
              <p className="team-role">Data Journalist</p>
              <div className="team-social">
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-github"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="container text-center">
          <h3>Join Our Community</h3>
          <p>Subscribe to our newsletter for weekly updates and exclusive content.</p>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="input-group">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Your email address"
                />
                <button className="btn btn-primary">
                  Subscribe <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
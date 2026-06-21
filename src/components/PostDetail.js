// frontend/src/components/PostDetail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Helmet } from 'react-helmet-async';
import tracking from '../utils/tracking';
import RelatedPosts from './RelatedPosts';
import useDocumentTitle from '../hooks/useDocumentTitle';
import API_URL from '../config'; // <-- ADDED

// ========== Skeleton Loader ==========
const Skeleton = () => {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-card">
        <div className="skeleton skeleton-badge" style={{ width: '120px', height: '32px' }}></div>
        <div className="skeleton skeleton-title" style={{ width: '80%', height: '48px', marginTop: '20px' }}></div>
        <div className="skeleton skeleton-author" style={{ width: '60%', height: '24px', marginTop: '16px' }}></div>
        <div className="skeleton skeleton-image" style={{ width: '100%', height: '320px', marginTop: '24px', borderRadius: '12px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '100%', height: '18px', marginTop: '24px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '95%', height: '18px', marginTop: '12px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '88%', height: '18px', marginTop: '12px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '92%', height: '18px', marginTop: '12px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '78%', height: '18px', marginTop: '12px' }}></div>
      </div>
      <style>{`
        .skeleton-wrapper { animation: fadeIn 0.3s ease; }
        .skeleton-card { background: white; border-radius: 16px; padding: 2rem 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .skeleton { background: #e2e8f0; border-radius: 8px; position: relative; overflow: hidden; }
        .skeleton::after {
          content: '';
          position: absolute; top: 0; left: -150%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { transform: translateX(0%); } 100% { transform: translateX(200%); } }
        .skeleton-badge { border-radius: 20px; }
        .skeleton-title { border-radius: 12px; }
        .skeleton-author { border-radius: 20px; }
        .skeleton-image { border-radius: 12px; background: #e2e8f0; }
        .skeleton-text { border-radius: 4px; }
        @media (max-width: 768px) { .skeleton-card { padding: 1.25rem; } .skeleton-image { height: 200px; } }
      `}</style>
    </div>
  );
};

// ========== Audio Player ==========
function AudioPlayer({ content, title }) {
  const [loading, setLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);

  const generateSpeech = async () => {
    setLoading(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      let plainText = tempDiv.textContent || tempDiv.innerText || '';
      plainText = plainText.replace(/\s+/g, ' ').trim();
      const textToRead = plainText.substring(0, 3000);
      const response = await axios.post(`${API_URL}/api/tts/speak`, 
        { text: textToRead, title: title || 'Article' },
        { responseType: 'blob', withCredentials: true, timeout: 60000 }
      );
      if (response.data && response.data.size > 0) {
        const url = URL.createObjectURL(response.data);
        setAudioSrc(url);
        toast.success('Audio ready!');
      }
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audio-player-card mb-4 p-3 rounded-3" style={{ background: '#f8f9fa', borderLeft: '4px solid #07255b' }}>
      {!audioSrc && (
        <button onClick={generateSpeech} className="btn rounded-pill px-4" style={{ backgroundColor: '#07255b', color: 'white', border: 'none' }} disabled={loading}>
          {loading ? 'Generating...' : 'Listen to Article'}
        </button>
      )}
      {audioSrc && (
        <audio controls className="w-100" autoPlay>
          <source src={audioSrc} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

// ========== Share Button ==========
function ShareButton({ title, url, image, description }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description || `Check out this article: ${title}`, url });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') toast.error('Failed to share');
      }
    } else {
      handleCopyLink();
    }
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <div className="share-button-container" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
        aria-label="Share"
      >
        <i className="fas fa-share-alt me-1"></i> Share
      </button>
      {isOpen && (
        <div className="share-dropdown">
          {navigator.share && (
            <button onClick={handleNativeShare} className="share-option">
              <i className="fas fa-mobile-alt"></i><span>Share...</span>
            </button>
          )}
          <button onClick={handleCopyLink} className="share-option">
            <i className="fas fa-link"></i><span>Copy Link</span>
          </button>
          <div className="share-divider"></div>
          <button onClick={() => handleShare('x')} className="share-option x">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
            </svg>
            <span>X (Twitter)</span>
          </button>
          <button onClick={() => handleShare('linkedin')} className="share-option linkedin">
            <i className="fab fa-linkedin-in"></i><span>LinkedIn</span>
          </button>
          <button onClick={() => handleShare('facebook')} className="share-option facebook">
            <i className="fab fa-facebook-f"></i><span>Facebook</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ========== Main Component ==========
function PostDetail({ isLoggedIn, adminData, currentUserId, isSuperAdmin }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [aiGeneratingComment, setAiGeneratingComment] = useState(false);
  const [commentData, setCommentData] = useState({
    author: '',
    email: '',
    site: '',
    content: ''
  });
  const contentRef = useRef(null);

  useDocumentTitle(post?.title, 'RootNetwork');

  // ---- Helpers ----
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_URL}${imagePath}`;
  };

  const getAuthorImage = (profileImage) => {
    if (!profileImage || profileImage === 'default-avatar.png') return null;
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    return `${API_URL}/static/${profileImage}`;
  };

  const isHTML = (content) => /<[a-z][\s\S]*>/i.test(content);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getReadingTime = (content) => {
    if (!content) return '1 min read';
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const addLazyLoadingToHTML = (html) => {
    if (!html) return html;
    return html.replace(/<img /g, '<img loading="lazy" decoding="async" ');
  };

  // ---- Render additional images with captions ----
  const renderContentWithImages = (content, images) => {
    if (!content) return content;
    if (!images || images.length === 0) return content;

    let html = content;
    images.forEach((img, index) => {
      const regex = new RegExp(`\\[image\\s*:\\s*${index}\\]`, 'gi');
      if (regex.test(html)) {
        const imageUrl = img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`;
        const imageHtml = `
          <figure class="post-image-figure my-4">
            <img
              src="${imageUrl}"
              alt="${img.alt || img.caption || 'Image'}"
              loading="lazy"
              decoding="async"
              class="img-fluid rounded-3 w-100"
              style="max-height: 500px; object-fit: cover;"
            />
            ${img.caption ? `<figcaption class="text-muted text-center small mt-2">${img.caption}</figcaption>` : ''}
          </figure>
        `;
        html = html.replace(regex, imageHtml);
      }
    });
    return html;
  };

  // ---- Fetch post ----
  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/${slug}`);
      setPost(response.data);
      await tracking.trackPageView('post', response.data.id);
    } catch (error) {
      console.error('Failed to fetch post', error);
      toast.error('Post not found');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  // ---- Comment handlers ----
  const handleAIComment = async () => {
    setAiGeneratingComment(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/comment`);
      const aiData = response.data;
      setCommentData({
        author: aiData.author,
        email: aiData.email,
        site: aiData.site,
        content: aiData.content
      });
      toast.success('AI comment generated!');
    } catch (error) {
      console.error('Failed to generate AI comment', error);
      toast.error('Failed to generate AI comment');
    } finally {
      setAiGeneratingComment(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentData.author || !commentData.content) {
      toast.error('Please provide name and comment');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/posts/${post.id}/comments`, commentData);
      toast.success('Comment added! Awaiting approval.');
      await tracking.trackAction('comment', `Comment on post: ${post.title}`, post.id, 'post');
      setCommentData({ author: '', email: '', site: '', content: '' });
      setReplyTo(null);
      fetchPost();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`${API_URL}/api/admin/posts/${post.id}`);
        toast.success('Post deleted');
        await tracking.trackAction('delete_post', `Post: ${post.title}`, post.id, 'post');
        navigate('/blog');
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  // ---- Loading state ----
  if (loading) {
    return <Skeleton />;
  }

  if (!post) {
    return <div className="alert alert-danger">Post not found</div>;
  }

  // ---- Meta data ----
  const metaDescription = post.meta_description || 
    (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) : 'Read our latest blog post for insights and updates.');
  const readingTime = post.reading_time || getReadingTime(post.content);
  const keywords = post.keywords || `${post.title}, blog, article, news`;
  const tags = keywords.split(',').map(tag => tag.trim()).filter(t => t);

  const DEFAULT_OG_IMAGE = 'https://res-console.cloudinary.com/dt2yse3jf/thumbnails/v1/image/upload/v1782030371/b2ctZGVmYXVsdF9sMWNsZms=/drilldown';
  const ogImage = post.image ? getImageUrl(post.image) : DEFAULT_OG_IMAGE;
  const ogImageAlt = post.title;
  const ogUrl = window.location.href;
  const siteName = 'RootNetwork';
  const twitterSite = '@RootNetwork';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": metaDescription,
    "image": ogImage,
    "author": {
      "@type": "Person",
      "name": post.author?.full_name || post.author?.username || "Anonymous"
    },
    "datePublished": post.timestamp,
    "dateModified": post.timestamp,
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${API_URL}/static/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@id": ogUrl
    },
    "keywords": keywords,
    "articleSection": post.category?.name || "General"
  };

  // ---- Render ----
  return (
    <>
      <Helmet>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={post.author?.full_name || post.author?.username || 'Admin'} />
        <meta name="reading-time" content={`${readingTime}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={twitterSite} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />
        <link rel="canonical" href={ogUrl} />
        <meta property="article:published_time" content={post.timestamp} />
        <meta property="article:author" content={post.author?.full_name || post.author?.username} />
        {post.category && <meta property="article:section" content={post.category.name} />}
        {tags.map((tag, idx) => <meta property="article:tag" content={tag} key={idx} />)}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="post-detail-container">
        <button className="btn btn-secondary mb-3" onClick={() => navigate('/blog')}>
          ← Back to News
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-4 p-lg-5">
            {post.category && (
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill" style={{ backgroundColor: '#07255b' }}>
                  <i className="fas fa-folder me-1"></i> {post.category.name}
                </span>
              </div>
            )}

            <h1 className="fw-bold display-5 mb-4">{post.title}</h1>

            <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="flex-shrink-0">
                  {getAuthorImage(post.author?.profile_image) ? (
                    <img src={getAuthorImage(post.author?.profile_image)} alt={post.author?.full_name || post.author?.username} className="rounded-circle" width="48" height="48" style={{ objectFit: 'cover', border: '2px solid #e9ecef' }} />
                  ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                      <i className="fas fa-user text-white fa-lg"></i>
                    </div>
                  )}
                </div>
                <div>
                  <div className="fw-bold">
                    {post.author?.full_name || post.author?.username || 'Unknown Author'}
                    {post.author?.is_super_admin && <span className="badge ms-2" style={{ backgroundColor: '#07255b', fontSize: '10px' }}>Admin</span>}
                  </div>
                  <div className="text-muted small">
                    <i className="far fa-calendar-alt me-1"></i> {formatDate(post.timestamp)}
                    <span className="mx-2">•</span>
                    <i className="far fa-clock me-1"></i> {readingTime} read
                  </div>
                </div>
              </div>
              <div className="mt-2 mt-sm-0">
                <ShareButton title={post.title} url={ogUrl} image={ogImage} description={metaDescription} />
              </div>
            </div>

            {post.image && (
              <div className="mb-4 text-center">
                <img
                  src={getImageUrl(post.image)}
                  alt={post.title}
                  className="img-fluid rounded-4 shadow-sm"
                  style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {post.content && <AudioPlayer content={post.content} title={post.title} />}

            <div className="post-detail-content mt-4" ref={contentRef}>
              {isHTML(post.content) ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderContentWithImages(
                      addLazyLoadingToHTML(post.content),
                      post.images
                    )
                  }}
                />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ src, alt, ...props }) => (
                      <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        {...props}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    )
                  }}
                >
                  {renderContentWithImages(post.content, post.images)}
                </ReactMarkdown>
              )}
            </div>
          </div>

          <div className="card-footer bg-white border-top-0 pb-4 px-4 px-lg-5">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => { navigator.clipboard.writeText(ogUrl); toast.success('Link copied!'); }}>
                  <i className="fas fa-copy me-1"></i> Copy Link
                </button>
              </div>
              {isLoggedIn && (isSuperAdmin || post.author_id === currentUserId) && (
                <div className="d-flex gap-2">
                  <button className="btn btn-sm rounded-pill px-3" style={{ backgroundColor: '#07255b', color: 'white', border: 'none' }} onClick={() => navigate(`/admin/edit/${post.slug}`)}>
                    <i className="fas fa-edit me-1"></i> Edit
                  </button>
                  <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={handleDeletePost}>
                    <i className="fas fa-trash me-1"></i> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <RelatedPosts postId={post.id} currentPostSlug={post.slug} />

        <div className="card mt-4 border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-3">
              <i className="fas fa-comments me-2" style={{ color: '#07255b' }}></i>
              Comments ({post.comments?.length || 0})
            </h5>
            <hr className="mb-4" />

            {post.comments && post.comments.length > 0 ? (
              post.comments.map(comment => (
                <div key={comment.id} className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{comment.author}</strong>
                      {comment.from_admin && <span className="badge ms-2" style={{ backgroundColor: '#07255b' }}>Admin</span>}
                      <br />
                      <small className="text-muted">{new Date(comment.timestamp).toLocaleString()}</small>
                    </div>
                    {isLoggedIn && replyTo !== comment.id && (
                      <button className="btn btn-sm btn-link" style={{ color: '#07255b' }} onClick={() => { setReplyTo(comment.id); setCommentData({ ...commentData, author: '', content: '' }); }}>
                        <i className="fas fa-reply me-1"></i> Reply
                      </button>
                    )}
                  </div>
                  <div className="comment-content p-3 bg-light rounded-3">
                    <ReactMarkdown>{comment.content}</ReactMarkdown>
                  </div>
                  {comment.replies && comment.replies.map(reply => (
                    <div key={reply.id} className="mt-3 ms-4 ps-3 border-start border-3" style={{ borderColor: '#07255b !important' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{reply.author}</strong>
                          {reply.from_admin && <span className="badge ms-2" style={{ backgroundColor: '#07255b' }}>Admin</span>}
                          <br />
                          <small className="text-muted">{new Date(reply.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                      <div className="comment-content p-2">
                        <ReactMarkdown>{reply.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-muted text-center py-4">
                <i className="fas fa-comment-slash fa-2x mb-2 d-block"></i>
                No comments yet. Be the first to comment!
              </p>
            )}

            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-3">
                {replyTo ? `Replying to comment #${replyTo}` : 'Leave a Comment'}
                {replyTo && (
                  <button className="btn btn-sm btn-link ms-2" style={{ color: '#07255b' }} onClick={() => setReplyTo(null)}>
                    Cancel Reply
                  </button>
                )}
              </h6>
              {!isLoggedIn && (
                <div className="alert alert-info small">
                  <i className="fas fa-info-circle me-2"></i>
                  Your comment will be reviewed by admin before appearing.
                </div>
              )}
              <div className="bg-light p-3 rounded-3">
                <div className="mb-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAIComment} disabled={aiGeneratingComment}>
                    {aiGeneratingComment ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span> Generating...</>
                    ) : (
                      '🤖 AI Comment'
                    )}
                  </button>
                  <small className="text-muted ms-2">Generate an AI-powered comment</small>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" placeholder="Your Name *"
                      value={commentData.author} onChange={(e) => setCommentData({...commentData, author: e.target.value})} />
                  </div>
                  <div className="col-md-6 mb-2">
                    <input type="email" className="form-control" placeholder="Your Email"
                      value={commentData.email} onChange={(e) => setCommentData({...commentData, email: e.target.value})} />
                  </div>
                </div>
                <input type="text" className="form-control mb-2" placeholder="Your Website (optional)"
                  value={commentData.site} onChange={(e) => setCommentData({...commentData, site: e.target.value})} />
                <textarea className="form-control mb-2" rows="4" placeholder="Your Comment *"
                  value={commentData.content} onChange={(e) => setCommentData({...commentData, content: e.target.value})} />
                <button className="btn rounded-pill px-4" style={{ backgroundColor: '#07255b', color: 'white', border: 'none' }} onClick={handleAddComment}>
                  <i className="fas fa-paper-plane me-2"></i> Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .share-button-container { position: relative; display: inline-block; }
        .share-dropdown {
          position: absolute; top: 100%; right: 0; left: auto; margin-top: 8px;
          background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          min-width: 200px; z-index: 1000; overflow: hidden; animation: fadeIn 0.2s ease;
        }
        .share-option { display: flex; align-items: center; gap: 12px; padding: 10px 16px; width: 100%; border: none; background: white; cursor: pointer; font-size: 14px; transition: background 0.2s; text-align: left; }
        .share-option:hover { background: #f8f9fa; }
        .share-option i { width: 20px; font-size: 16px; }
        .share-option.x svg { width: 16px; height: 16px; }
        .share-option.linkedin i { color: #0077b5; }
        .share-option.facebook i { color: #1877f2; }
        .share-divider { height: 1px; background: #e9ecef; margin: 4px 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .share-dropdown { left: 50%; right: auto; transform: translateX(-50%); min-width: 180px; } }
        .post-detail-content { font-size: 1.1rem; line-height: 1.8; }
        .post-detail-content img { max-width: 100%; height: auto; border-radius: 8px; }
        .comment-content { word-wrap: break-word; }
        .post-image-figure {
          margin: 1.5rem 0;
        }
        .post-image-figure figcaption {
          font-style: italic;
          opacity: 0.8;
        }
      `}</style>
    </>
  );
}

export default PostDetail;

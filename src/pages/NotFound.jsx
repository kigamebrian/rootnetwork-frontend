// frontend/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

function NotFound() {
  useDocumentTitle('Page Not Found', 'RootNetwork');

  return (
    <div className="container py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="display-1 fw-bold text-muted">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="text-muted mb-4">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            <i className="fas fa-home me-2"></i> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

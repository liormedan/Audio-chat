import React from 'react';
import './Pages.css';

function PageHeader({ title, description, onBack }) {
  return (
    <div className="page-header">
      <div className="page-header-top">
        <button className="back-button" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to chat
        </button>
      </div>
      <h2>{title}</h2>
      {description && <p className="page-description">{description}</p>}
    </div>
  );
}

export default PageHeader;
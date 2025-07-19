import React from 'react';
import processingHistoryService from '../services/processingHistory';
import './ProcessingHistory.css';

function ProcessingHistory({ originalFileId, onSelectHistoryEntry }) {
  const history = originalFileId 
    ? processingHistoryService.getHistoryForFile(originalFileId)
    : processingHistoryService.getHistory();

  if (history.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="processing-history">
      <h4>{originalFileId ? 'Processing History' : 'Recent Processing'}</h4>
      <div className="history-list">
        {history.map((entry) => (
          <div 
            key={entry.id} 
            className={`history-item ${entry.isFavorite ? 'favorite' : ''}`}
            onClick={() => onSelectHistoryEntry(entry)}
          >
            <div className="history-item-header">
              <div className="timestamp">{formatDate(entry.timestamp)}</div>
              <div 
                className="favorite-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  processingHistoryService.toggleFavorite(entry.id);
                }}
              >
                {entry.isFavorite ? '★' : '☆'}
              </div>
            </div>
            <div className="instructions">{truncateText(entry.instructions)}</div>
            <div className="steps">
              {entry.processingSteps.length} processing steps applied
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProcessingHistory;
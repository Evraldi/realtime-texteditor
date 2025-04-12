import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/dateUtils';

/**
 * DocumentItem component displays a single document in the document list
 * with enhanced UI and functionality
 */
const DocumentItem = ({ document, onDelete }) => {
  const { _id, title, updatedAt, createdBy } = document;

  // Format the date for better readability
  const formattedDate = formatDate(updatedAt);

  // Truncate long titles
  const displayTitle = title.length > 30 ? `${title.substring(0, 30)}...` : title;

  return (
    <div className="document-item">
      <div className="document-info">
        <Link to={`/documents/${_id}`} className="document-title">
          {displayTitle}
        </Link>
        <div className="document-meta">
          <span className="document-date">Last edited: {formattedDate}</span>
          {createdBy && (
            <span className="document-author">Created by: {createdBy.email}</span>
          )}
        </div>
      </div>

      <div className="document-actions">
        <Link
          to={`/documents/${_id}`}
          className="btn btn-sm btn-primary"
          title="Edit document"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(_id)}
          className="btn btn-sm btn-danger ml-2"
          title="Delete document"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

DocumentItem.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    createdBy: PropTypes.shape({
      _id: PropTypes.string,
      email: PropTypes.string
    })
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default DocumentItem;
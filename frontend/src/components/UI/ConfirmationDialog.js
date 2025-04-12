import React from 'react';
import PropTypes from 'prop-types';
import './ConfirmationDialog.css';

/**
 * Reusable confirmation dialog component
 * @param {Object} props - Component props
 * @returns {JSX.Element|null} Confirmation dialog component or null if not open
 */
const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`confirmation-dialog ${type}`}>
        <div className="confirmation-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['warning', 'danger', 'info'])
};

ConfirmationDialog.defaultProps = {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'warning'
};

export default ConfirmationDialog;

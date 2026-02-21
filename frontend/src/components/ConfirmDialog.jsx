import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  type = 'danger' // 'danger', 'warning', 'info'
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog-header ${type}`}>
          <h3>{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button onClick={onCancel} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn-${type}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

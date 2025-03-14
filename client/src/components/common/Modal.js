// src/components/common/Modal.js
import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ show, onClose, title, children, onConfirm }) => {
  if (!show) return null;
  
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <FaTimes className="me-2" />キャンセル
            </button>
            {onConfirm && (
              <button type="button" className="btn btn-primary" onClick={onConfirm}>
                確認
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default Modal;

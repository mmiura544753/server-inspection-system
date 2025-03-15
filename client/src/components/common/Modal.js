// src/components/common/Modal.js
import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const Modal = ({ show, onClose, title, children, onConfirm }) => {
  useEffect(() => {
    // モーダルが表示されている間はスクロールを無効化
    if (show) {
      document.body.style.overflow = "hidden";
    }

    // クリーンアップ関数
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  if (!show) return null;

  // モーダル背景クリック時に閉じる処理を追加
  const handleBackdropClick = (e) => {
    // モーダル自体ではなく背景がクリックされた場合のみ閉じる
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <FaTimes className="me-2" />
              キャンセル
            </button>
            {onConfirm && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConfirm}
              >
                確認
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

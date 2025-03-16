// src/components/common/Modal.js
import React, { useEffect } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const Modal = ({
  show,
  onClose,
  title,
  children,
  onConfirm,
  showCompleteButton = false, // 完了ボタンを表示するかどうかのフラグ
  showCancelButton = true, // キャンセルボタンを表示するかどうかのフラグ
}) => {
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

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
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
              {/* インポート完了時に表示する「完了」ボタン */}
              {showCompleteButton && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  <FaCheckCircle className="me-2" />
                  完了
                </button>
              )}

              {/* 削除確認時に表示する「キャンセル」ボタン */}
              {showCancelButton && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  <FaTimes className="me-2" />
                  キャンセル
                </button>
              )}

              {/* 削除確認時に表示する「確認」ボタン */}
              {onConfirm && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onConfirm}
                >
                  <FaCheckCircle className="me-2" />
                  確認
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default Modal;

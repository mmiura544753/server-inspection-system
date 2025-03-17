// src/components/devices/ImportResultModal.js
import React from 'react';
import Modal from '../common/Modal';

// インポート結果モーダルコンポーネント
const ImportResultModal = ({ show, onClose, loading, result }) => {
  if (!result) return null;

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={loading ? "インポート処理中..." : "インポート結果"}
    >
      <div>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">処理中...</span>
            </div>
            <p>{result.progress || "データ処理中..."}</p>
            <p className="text-muted small">
              インポート処理には数分かかる場合があります。
              <br />
              この画面を閉じても処理は継続されます。
            </p>
          </div>
        ) : (
          <>
            <p>{result.message}</p>

            {result.errors && result.errors.length > 0 && (
              <div className="alert alert-warning">
                <h6>以下の行でエラーが発生しました：</h6>
                <ul>
                  {result.errors.map((error, idx) => (
                    <li key={idx}>
                      {error.row["機器名"] ||
                        error.row["device_name"] ||
                        "不明な機器"}
                      : {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.importedDevices &&
              result.importedDevices.length > 0 && (
                <div>
                  <h6>インポートされた機器：</h6>
                  <ul>
                    {result.importedDevices
                      .slice(0, 10)
                      .map((device) => (
                        <li key={device.id}>
                          {device.device_name} ({device.customer_name})
                        </li>
                      ))}
                    {result.importedDevices.length > 10 && (
                      <li>
                        ...他 {result.importedDevices.length - 10} 件
                      </li>
                    )}
                  </ul>
                </div>
              )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImportResultModal;

// src/components/devices/DeviceExportImport.js
import React, { useState } from 'react';
import { FaFileDownload, FaFileUpload } from 'react-icons/fa';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

const DeviceExportImport = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // CSVファイルのエクスポート処理
  const handleExport = () => {
    try {
      // ダウンロードリンクの作成
      const downloadUrl = `${API_BASE_URL}/devices/export`;
      
      // ファイル名の設定
      const date = new Date();
      const filename = `devices_export_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.csv`;
      
      // ダウンロードリンクを作成してクリック
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSVのエクスポート中にエラーが発生しました:', err);
    }
  };

  // ファイル選択時の処理
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setImportError(null);
  };

  // CSVファイルのインポート処理
  const handleImport = async () => {
    if (!file) {
      setImportError('ファイルを選択してください');
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportError('CSVファイルを選択してください');
      return;
    }

    try {
      setUploading(true);
      setImportError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/devices/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      setShowModal(true);
      
      // 親コンポーネントに成功を通知
      if (onImportSuccess && typeof onImportSuccess === 'function') {
        onImportSuccess();
      }
    } catch (err) {
      console.error('CSVのインポート中にエラーが発生しました:', err);
      setImportError(
        err.response?.data?.message || 
        'CSVのインポート中にエラーが発生しました'
      );
    } finally {
      setUploading(false);
      setFile(null);
      
      // ファイル入力をリセット
      const fileInput = document.getElementById('csvFile');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">CSVエクスポート/インポート</h5>
      </div>
      <div className="card-body">
        <div className="row">
          {/* エクスポート機能 */}
          <div className="col-md-6 mb-3 mb-md-0">
            <div className="d-grid">
              <button 
                className="btn btn-primary"
                onClick={handleExport}
              >
                <FaFileDownload className="me-2" />
                機器一覧をCSVでエクスポート
              </button>
            </div>
          </div>
          
          {/* インポート機能 */}
          <div className="col-md-6">
            <div className="input-group mb-3">
              <input
                type="file"
                className="form-control"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <button
                className="btn btn-success"
                type="button"
                onClick={handleImport}
                disabled={!file || uploading}
              >
                <FaFileUpload className="me-2" />
                {uploading ? 'インポート中...' : 'インポート'}
              </button>
            </div>
            {importError && <Alert type="danger" message={importError} />}
          </div>
        </div>
        
        <div className="mt-3">
          <small className="text-muted">
            <strong>注意:</strong> CSVファイルのフォーマットは、機器名、顧客名、モデル、設置場所、機器種別、ハードウェアタイプのカラムが必要です。
            既存の機器をIDで指定すると更新され、指定しないと新規作成されます。
          </small>
        </div>
      </div>
      
      {/* インポート結果モーダル */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="インポート結果"
      >
        {importResult && (
          <div>
            <p>{importResult.message}</p>
            
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="alert alert-warning">
                <h6>以下の行でエラーが発生しました：</h6>
                <ul>
                  {importResult.errors.map((error, idx) => (
                    <li key={idx}>
                      {error.row['機器名'] || 'No name'}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {importResult.importedDevices && importResult.importedDevices.length > 0 && (
              <div>
                <h6>インポートされた機器：</h6>
                <ul>
                  {importResult.importedDevices.slice(0, 10).map((device) => (
                    <li key={device.id}>
                      {device.device_name} ({device.customer_name})
                    </li>
                  ))}
                  {importResult.importedDevices.length > 10 && (
                    <li>...他 {importResult.importedDevices.length - 10} 件</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviceExportImport;

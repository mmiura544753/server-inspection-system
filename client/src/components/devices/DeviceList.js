// src/components/devices/DeviceList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from "react-icons/fa";
import { deviceAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";
import DeviceExportImport from "./DeviceExportImport";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // 機器一覧データの取得
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await deviceAPI.getAll();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError("機器データの取得に失敗しました。");
      console.error("機器一覧取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchDevices();
  }, []);

  // 削除確認モーダルを表示
  const handleDeleteClick = (device) => {
    setDeviceToDelete(device);
    setShowDeleteModal(true);
  };

  // 機器の削除処理
  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;

    try {
      await deviceAPI.delete(deviceToDelete.id);

      // 成功したら、機器リストから削除した機器を除外
      setDevices(devices.filter((d) => d.id !== deviceToDelete.id));

      setShowDeleteModal(false);
      setDeviceToDelete(null);
    } catch (err) {
      setError("機器の削除に失敗しました。");
      console.error("機器削除エラー:", err);
    }
  };

  // CSVインポート成功時のハンドラー
  const handleImportSuccess = () => {
    // 機器一覧を再取得
    fetchDevices();
  };

  // 検索フィルター
  const filteredDevices = devices.filter(
    (device) =>
      device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.customer_name &&
        device.customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (device.model &&
        device.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 時刻フォーマット関数
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString("ja-JP", options);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">機器一覧</h1>
        <Link to="/devices/new" className="btn btn-primary">
          <FaPlus className="me-2" /> 新規機器登録
        </Link>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* CSVエクスポート/インポートコンポーネント */}
      <DeviceExportImport onImportSuccess={handleImportSuccess} />

      {/* 検索フォーム */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="機器名、顧客名、モデルで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 機器一覧テーブル */}
      {filteredDevices.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>機器名</th>
                    <th>顧客</th>
                    <th>種別</th>
                    <th>ハードウェア</th>
                    <th>設置場所</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.id}>
                      <td>{device.id}</td>
                      <td>{device.device_name}</td>
                      <td>{device.customer_name}</td>
                      <td>{device.device_type}</td>
                      <td>{device.hardware_type}</td>
                      <td>{device.location || "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/devices/${device.id}`}
                            className="btn btn-sm btn-info"
                            title="詳細"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/devices/edit/${device.id}`}
                            className="btn btn-sm btn-warning"
                            title="編集"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            title="削除"
                            onClick={() => handleDeleteClick(device)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          {searchTerm
            ? "検索条件に一致する機器はありません。"
            : "機器データがありません。"}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="機器削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>機器「{deviceToDelete?.device_name}」を削除してもよろしいですか？</p>
        <p className="text-danger">
          削除すると、この機器に関連するすべての点検データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default DeviceList;

// src/components/devices/DeviceList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaDownload,
} from "react-icons/fa";
import { deviceAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportError, setExportError] = useState(null);
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

  // CSVエクスポート機能 - SJIS形式のみに修正
  const handleExportCSV = async () => {
    try {
      setExportError(null);
      // APIからBlobとしてCSVをダウンロード (shift_jis固定)
      const response = await deviceAPI.exportData("csv", "shift_jis");

      // Blobからダウンロードリンクを作成
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `device_list_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setExportError("機器データのエクスポートに失敗しました。");
      console.error("機器エクスポートエラー:", err);
    }
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

  // 以下はレンダリング部分
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">機器一覧</h1>
        <div>
          {/* エクスポートボタンを1つだけにする */}
          <button
            onClick={handleExportCSV}
            className="btn btn-success me-2"
            title="CSVエクスポート"
          >
            <FaDownload className="me-2" /> CSVエクスポート
          </button>
          <Link to="/devices/new" className="btn btn-primary">
            <FaPlus className="me-2" /> 新規機器登録
          </Link>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}
      {exportError && <Alert type="danger" message={exportError} />}

      {/* 以下の部分は変更なし */}
      {/* ... */}
    </div>
  );
};

export default DeviceList;
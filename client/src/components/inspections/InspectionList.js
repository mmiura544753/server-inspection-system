// src/components/inspections/InspectionList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from "react-icons/fa";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const InspectionList = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState(null);

  // 点検一覧データの取得
  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionAPI.getAll();
      setInspections(data);
      setError(null);
    } catch (err) {
      setError("点検データの取得に失敗しました。");
      console.error("点検一覧取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchInspections();
  }, []);

  // 削除確認モーダルを表示
  const handleDeleteClick = (inspection) => {
    setInspectionToDelete(inspection);
    setShowDeleteModal(true);
  };

  // 点検の削除処理
  const handleDeleteConfirm = async () => {
    if (!inspectionToDelete) return;

    try {
      await inspectionAPI.delete(inspectionToDelete.id);

      // 成功したら、点検リストから削除した点検を除外
      setInspections(inspections.filter((i) => i.id !== inspectionToDelete.id));

      setShowDeleteModal(false);
      setInspectionToDelete(null);
    } catch (err) {
      setError("点検の削除に失敗しました。");
      console.error("点検削除エラー:", err);
    }
  };

  // 検索フィルター
  const filteredInspections = inspections.filter(
    (inspection) =>
      (inspection.device_name &&
        inspection.device_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (inspection.customer_name &&
        inspection.customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (inspection.inspector_name &&
        inspection.inspector_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (inspection.inspection_type &&
        inspection.inspection_type
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("ja-JP", options);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">点検作業一覧</h1>
        <Link to="/inspections/new" className="btn btn-primary">
          <FaPlus className="me-2" /> 新規点検登録
        </Link>
      </div>

      {error && <Alert type="danger" message={error} />}

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
              placeholder="機器名、顧客名、点検者名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 点検一覧テーブル */}
      {filteredInspections.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>点検日</th>
                    <th>機器名</th>
                    <th>顧客名</th>
                    <th>点検者</th>
                    <th>点検種別</th>
                    <th>ステータス</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.map((inspection) => (
                    <tr key={inspection.id}>
                      <td>{inspection.id}</td>
                      <td>{formatDate(inspection.inspection_date)}</td>
                      <td>{inspection.device_name}</td>
                      <td>{inspection.customer_name}</td>
                      <td>{inspection.inspector_name}</td>
                      <td>{inspection.inspection_type}</td>
                      <td>
                        <span
                          className={`badge ${inspection.status === "完了" ? "bg-success" : "bg-warning"}`}
                        >
                          {inspection.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/inspections/${inspection.id}`}
                            className="btn btn-sm btn-info me-1"
                            title="詳細"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/inspections/edit/${inspection.id}`}
                            className="btn btn-sm btn-warning me-1"
                            title="編集"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            title="削除"
                            onClick={() => handleDeleteClick(inspection)}
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
            ? "検索条件に一致する点検はありません。"
            : "点検データがありません。"}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="点検削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>
          点検ID「{inspectionToDelete?.id}」の記録を削除してもよろしいですか？
        </p>
        <p className="text-danger">
          削除すると、この点検に関連するすべての詳細データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionList;

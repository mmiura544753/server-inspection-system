// src/components/inspections/InspectionItemList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { inspectionItemAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const InspectionItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 点検項目データの取得
  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await inspectionItemAPI.getAll();
      setItems(data);
      setError(null);
    } catch (err) {
      setError("点検項目データの取得に失敗しました。");
      console.error("点検項目一覧取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchItems();
  }, []);

  // 削除確認モーダルを表示
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // 点検項目の削除処理
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await inspectionItemAPI.delete(itemToDelete.id);

      // 成功したら、リストから削除した項目を除外
      setItems(items.filter((i) => i.id !== itemToDelete.id));

      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setError("点検項目の削除に失敗しました。");
      console.error("点検項目削除エラー:", err);
    }
  };

  // 検索フィルター
  const filteredItems = items.filter(
    (item) =>
      (item.item_name &&
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.device_name &&
        item.device_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customer_name &&
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">点検項目マスタ</h1>
        <Link to="/inspection-items/new" className="btn btn-primary">
          <FaPlus className="me-2" /> 新規点検項目登録
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
              placeholder="点検項目名、機器名、顧客名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 点検項目一覧テーブル */}
      {filteredItems.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>点検項目名</th>
                    <th>機器名</th>
                    <th>顧客名</th>
                    <th>作成日</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.item_name}</td>
                      <td>{item.device_name}</td>
                      <td>{item.customer_name}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/inspection-items/edit/${item.id}`}
                            className="btn btn-sm btn-warning me-1"
                            title="編集"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            title="削除"
                            onClick={() => handleDeleteClick(item)}
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
            ? "検索条件に一致する点検項目はありません。"
            : "点検項目データがありません。"}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="点検項目削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>点検項目「{itemToDelete?.item_name}」を削除してもよろしいですか？</p>
        <p className="text-danger">
          削除すると、この点検項目を使用した過去の点検結果にも影響がある可能性があります。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionItemList;

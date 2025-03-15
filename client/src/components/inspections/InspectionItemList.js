// src/components/inspections/InspectionItemList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaSearch } from "react-icons/fa";
import { inspectionItemAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

const InspectionItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    </div>
  );
};

export default InspectionItemList;

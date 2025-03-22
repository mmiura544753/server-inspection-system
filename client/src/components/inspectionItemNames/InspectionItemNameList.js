// src/components/inspectionItemNames/InspectionItemNameList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { inspectionItemAPI } from '../../services/api';
import Loading from '../common/Loading';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import SortableTableHeader from '../common/SortableTableHeader';
import { sortArrayByKey } from '../../utils/sortUtils';

const InspectionItemNameList = () => {
  // 状態管理
  const [itemNames, setItemNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ソート状態
  const [sortField, setSortField] = useState('name');
  const [sortDescending, setSortDescending] = useState(false);
  
  // 削除ダイアログ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemNameToDelete, setItemNameToDelete] = useState(null);

  // データ取得
  const fetchItemNames = async () => {
    try {
      setLoading(true);
      const data = await inspectionItemAPI.itemNames.getAll();
      setItemNames(data);
      setError(null);
    } catch (err) {
      console.error('点検項目名取得エラー:', err);
      setError('点検項目名の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchItemNames();
  }, []);

  // 削除確認モーダルの表示
  const handleDeleteClick = (itemName) => {
    setItemNameToDelete(itemName);
    setShowDeleteModal(true);
  };

  // 削除処理
  const handleDeleteConfirm = async () => {
    if (!itemNameToDelete) return;

    try {
      await inspectionItemAPI.itemNames.delete(itemNameToDelete.id);
      
      // 成功メッセージ表示
      setSuccessMessage(`点検項目名「${itemNameToDelete.name}」を削除しました`);
      
      // データを再取得
      fetchItemNames();
      
      // モーダルを閉じる
      setShowDeleteModal(false);
      setItemNameToDelete(null);
    } catch (err) {
      console.error('点検項目名削除エラー:', err);
      setError(err.response?.data?.message || '点検項目名の削除に失敗しました');
      setShowDeleteModal(false);
    }
  };

  // ソート処理
  const handleSort = (field, descending) => {
    setSortField(field);
    setSortDescending(descending);
  };

  // 検索フィルター
  const filteredItemNames = itemNames.filter(
    item => item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ソート適用
  const sortedItemNames = sortArrayByKey(filteredItemNames, sortField, sortDescending);

  if (loading) return <Loading />;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">点検項目名マスタ</h1>
        <Link to="/inspection-item-names/new" className="btn btn-primary">
          <FaPlus className="me-2" /> 新規点検項目名登録
        </Link>
      </div>

      {/* エラーおよび成功メッセージ */}
      {error && <Alert type="danger" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {/* 説明文 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">点検項目名マスタについて</h5>
          <p>
            点検項目名マスタは、点検項目で使用される項目名の標準化と一元管理を行うためのものです。
            新しい点検項目を作成する際は、このマスタに登録された項目名から選択することで、
            点検項目名の統一性を保ち、データの品質を向上させることができます。
          </p>
        </div>
      </div>

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
              placeholder="点検項目名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 点検項目名一覧 */}
      {sortedItemNames.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <SortableTableHeader
                      field="id"
                      label="ID"
                      currentSortField={sortField}
                      isDescending={sortDescending}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      field="name"
                      label="点検項目名"
                      currentSortField={sortField}
                      isDescending={sortDescending}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      field="created_at"
                      label="作成日"
                      currentSortField={sortField}
                      isDescending={sortDescending}
                      onSort={handleSort}
                    />
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItemNames.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/inspection-item-names/edit/${item.id}`}
                            className="btn btn-sm btn-warning"
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
            ? "検索条件に一致する点検項目名はありません。"
            : "点検項目名が登録されていません。"}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="点検項目名削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>
          点検項目名「{itemNameToDelete?.name}」を削除してもよろしいですか？
        </p>
        <p className="text-danger">
          この点検項目名が点検項目で使用されている場合は削除できません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionItemNameList;
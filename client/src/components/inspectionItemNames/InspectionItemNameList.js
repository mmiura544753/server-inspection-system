// src/components/inspectionItemNames/InspectionItemNameList.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaUpload } from 'react-icons/fa';
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
  const [exportError, setExportError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // ソート状態
  const [sortField, setSortField] = useState('name');
  const [sortDescending, setSortDescending] = useState(false);
  
  // 削除ダイアログ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemNameToDelete, setItemNameToDelete] = useState(null);
  
  // ファイル入力用のref
  const fileInputRef = useRef(null);

  // データ取得
  const fetchItemNames = async () => {
    try {
      setLoading(true);
      const data = await inspectionItemAPI.itemNames.getAll();
      setItemNames(data);
      setError(null);
    } catch (err) {
      console.error('確認作業項目取得エラー:', err);
      setError('確認作業項目の取得に失敗しました');
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
      setSuccessMessage(`確認作業項目「${itemNameToDelete.name}」を削除しました`);
      
      // データを再取得
      fetchItemNames();
      
      // モーダルを閉じる
      setShowDeleteModal(false);
      setItemNameToDelete(null);
    } catch (err) {
      console.error('確認作業項目削除エラー:', err);
      setError(err.response?.data?.message || '確認作業項目の削除に失敗しました');
      setShowDeleteModal(false);
    }
  };
  
  // CSVエクスポート機能
  const handleExportCSV = async () => {
    try {
      setExportError(null);
      // APIからBlobとしてCSVをダウンロード (shift_jis固定)
      const response = await inspectionItemAPI.itemNames.exportToCsv('shift_jis');

      // Blobからダウンロードリンクを作成
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `confirmation_work_items_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setExportError("確認作業項目のエクスポートに失敗しました。");
      console.error("確認作業項目エクスポートエラー:", err);
    }
  };

  // ファイル選択ダイアログを開く
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // ファイルインポート
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // CSVファイルか確認
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportError("CSVファイルを選択してください");
      return;
    }

    try {
      setImportError(null);
      setImportSuccess(null);
      setImportLoading(true);

      console.log("インポート処理開始:", file.name);

      // インポート実行
      const response = await inspectionItemAPI.itemNames.importFromCsv(file);
      console.log("インポート完了 - レスポンス:", response);

      // 成功メッセージの表示
      const importedCount =
        response.data?.importedRows || response.importedRows || 0;
      setImportSuccess(`${importedCount}件のデータをインポートしました`);

      // 点検項目名リストを再読み込み
      fetchItemNames();
    } catch (err) {
      console.error("CSVインポートエラー詳細:", err);
      setImportError(err.message || "CSVのインポート中にエラーが発生しました");
    } finally {
      setImportLoading(false);
      // ファイル入力をリセット
      e.target.value = "";
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
        <h1 className="h2">確認作業項目マスタ</h1>
        <div>
          <button
            onClick={handleExportCSV}
            className="btn btn-success me-2"
            title="CSVエクスポート"
          >
            <FaDownload className="me-2" /> CSVエクスポート
          </button>
          <button
            onClick={handleImportClick}
            className="btn btn-info me-2"
            title="CSVインポート"
            disabled={importLoading}
          >
            <FaUpload className="me-2" />
            {importLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                インポート中...
              </>
            ) : (
              "CSVインポート"
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept=".csv"
            onChange={handleFileChange}
          />
          <Link to="/inspection-item-names/new" className="btn btn-primary">
            <FaPlus className="me-2" /> 新規確認作業項目登録
          </Link>
        </div>
      </div>

      {/* エラーおよび成功メッセージ */}
      {error && <Alert type="danger" message={error} />}
      {exportError && <Alert type="danger" message={exportError} />}
      {importError && <Alert type="danger" message={importError} />}
      {successMessage && <Alert type="success" message={successMessage} />}
      {importSuccess && <Alert type="success" message={importSuccess} />}

      {/* 説明文 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">確認作業項目マスタについて</h5>
          <p>
            確認作業項目マスタは、点検項目で使用される作業項目の標準化と一元管理を行うためのものです。
            新しい点検項目を作成する際は、このマスタに登録された作業項目から選択することで、
            確認作業項目の統一性を保ち、データの品質を向上させることができます。
          </p>
        </div>
      </div>
      
      {/* インポート・エクスポート説明 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">CSVインポート・エクスポートについて</h5>
          <p className="mb-0">
            <strong>CSVエクスポート</strong>:
            現在の確認作業項目一覧をSJIS形式のCSVファイルでダウンロードします。
          </p>
          <p className="mb-0">
            <strong>CSVインポート</strong>:
            CSVファイルから確認作業項目を一括登録します。ファイル形式はSJISエンコーディングが推奨です。
          </p>
          <p className="small text-muted mt-2">
            インポート用CSVのフォーマット: ID（更新時のみ）、確認作業項目の列が必要です。
            IDを指定すると既存データが更新され、指定がない場合は新規作成されます。
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
              placeholder="確認作業項目で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 確認作業項目一覧 */}
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
                      label="確認作業項目"
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
            ? "検索条件に一致する確認作業項目はありません。"
            : "確認作業項目が登録されていません。"}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="確認作業項目削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>
          確認作業項目「{itemNameToDelete?.name}」を削除してもよろしいですか？
        </p>
        <p className="text-danger">
          この確認作業項目が点検項目で使用されている場合は削除できません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionItemNameList;
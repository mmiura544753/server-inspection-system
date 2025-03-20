// src/components/inspectionItems/InspectionItemList.js
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaDownload,
  FaUpload,
} from "react-icons/fa";
import { inspectionItemAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";
import SortableTableHeader from "../common/SortableTableHeader";
import { sortArrayByKey } from "../../utils/sortUtils";

const InspectionItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importProgress, setImportProgress] = useState("");
  
  // ソート用の状態追加
  const [sortField, setSortField] = useState("id");
  const [sortDescending, setSortDescending] = useState(false);

  // ファイル入力用のref
  const fileInputRef = useRef(null);

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

  // CSVエクスポート機能
  const handleExportCSV = async () => {
    try {
      setExportError(null);
      // APIからBlobとしてCSVをダウンロード
      const response = await inspectionItemAPI.exportData("csv", "shift_jis");

      // Blobからダウンロードリンクを作成
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inspection_items_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setExportError("点検項目データのエクスポートに失敗しました。");
      console.error("点検項目エクスポートエラー:", err);
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
      setImportProgress("CSVファイルを解析中...");

      console.log("インポート処理開始:", file.name);

      // インポート開始前に処理中モーダルを表示
      setImportResult({
        message: "インポート処理中...",
        status: "processing",
        progress: "リクエストを送信中...",
      });
      setShowImportResultModal(true);

      // 進捗状況メッセージを定期的に更新
      let progressTimer = setTimeout(function updateProgress() {
        setImportProgress((prev) => {
          const messages = [
            "CSVファイルを解析中...",
            "データを処理中...",
            "データベースに保存中...",
            "少々お待ちください...",
            "インポート処理が完了するまでこのままお待ちください...",
          ];
          // ランダムに別のメッセージを選択
          let newMsg;
          do {
            newMsg = messages[Math.floor(Math.random() * messages.length)];
          } while (newMsg === prev);
          return newMsg;
        });

        // インポート結果モーダルも更新
        setImportResult((prev) => ({
          ...prev,
          progress: `処理中... ${new Date().toLocaleTimeString()}`,
        }));

        // 次の更新をスケジュール
        progressTimer = setTimeout(updateProgress, 5000);
      }, 5000);

      // インポート処理実行
      const response = await inspectionItemAPI.importData(file);
      console.log("インポート完了 - レスポンス:", response);

      // タイマーをクリア
      clearTimeout(progressTimer);

      // 結果を保存
      setImportResult(response.data || response);
      setShowImportResultModal(true);

      // 成功メッセージの表示
      const importedCount =
        response.data?.importedRows || response.importedRows || 0;
      setImportSuccess(`${importedCount}件の点検項目をインポートしました`);

      // 点検項目リストを再読み込み
      fetchItems();
    } catch (err) {
      console.error("CSVインポートエラー詳細:", err);
      setImportError(err.message || "CSVのインポート中にエラーが発生しました");
      // エラーモーダルも表示
      setImportResult({
        message: "インポート中にエラーが発生しました",
        status: "error",
        errors: [
          {
            row: {},
            error: err.message || "詳細不明のエラー",
          },
        ],
      });
      setShowImportResultModal(true);
    } finally {
      setImportLoading(false);
      setImportProgress("");
      // ファイル入力をリセット
      e.target.value = "";
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
        typeof item.item_name === "string" &&
        item.item_name.includes(searchTerm)) ||
      (item.device_name &&
        typeof item.device_name === "string" &&
        item.device_name.includes(searchTerm)) ||
      (item.customer_name &&
        typeof item.customer_name === "string" &&
        item.customer_name.includes(searchTerm))
  );

  // ソートの処理
  const handleSort = (field, descending) => {
    setSortField(field);
    setSortDescending(descending);
  };

  // ソートされたデータ
  const sortedItems = sortArrayByKey(filteredItems, sortField, sortDescending);

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
                {importProgress || "インポート中..."}
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
          <Link to="/inspection-items/new" className="btn btn-primary">
            <FaPlus className="me-2" /> 新規点検項目登録
          </Link>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}
      {exportError && <Alert type="danger" message={exportError} />}
      {importError && <Alert type="danger" message={importError} />}
      {importSuccess && <Alert type="success" message={importSuccess} />}

      {/* インポート注意事項 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">CSVインポート・エクスポートについて</h5>
          <p className="mb-0">
            <strong>CSVエクスポート</strong>:
            現在の点検項目一覧をSJIS形式のCSVファイルでダウンロードします。
          </p>
          <p className="mb-0">
            <strong>CSVインポート</strong>:
            CSVファイルから点検項目情報を一括登録します。ファイル形式はSJISエンコーディングが推奨です。
          </p>
          <p className="small text-muted mt-2">
            インポート用CSVのフォーマット:
            点検項目名、機器名、顧客名のカラムが必要です。
            存在しない顧客名や機器名の場合は自動的に新規作成されます。
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
              placeholder="点検項目名、機器名、顧客名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 点検項目一覧テーブル */}
      {sortedItems.length > 0 ? (
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
                      field="item_name"
                      label="点検項目名"
                      currentSortField={sortField}
                      isDescending={sortDescending}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      field="device_name"
                      label="機器名"
                      currentSortField={sortField}
                      isDescending={sortDescending}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      field="customer_name"
                      label="顧客名"
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
                  {sortedItems.map((item) => (
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

      {/* インポート結果モーダル */}
      <Modal
        show={showImportResultModal}
        onClose={() => !importLoading && setShowImportResultModal(false)}
        title={importLoading ? "インポート処理中..." : "インポート結果"}
      >
        {importResult && (
          <div>
            {importLoading ? (
              <div className="text-center">
                <div className="spinner-border text-primary my-3" role="status">
                  <span className="visually-hidden">処理中...</span>
                </div>
                <p>{importResult.progress || "データ処理中..."}</p>
                <p className="text-muted small">
                  インポート処理には数分かかる場合があります。
                  <br />
                  この画面を閉じても処理は継続されます。
                </p>
              </div>
            ) : (
              <>
                <p>{importResult.message}</p>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="alert alert-warning">
                    <h6>以下の行でエラーが発生しました：</h6>
                    <ul>
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>
                          {error.row["点検項目名"] ||
                            error.row["item_name"] ||
                            "不明な項目"}
                          : {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.importedItems &&
                  importResult.importedItems.length > 0 && (
                    <div>
                      <h6>インポートされた点検項目：</h6>
                      <ul>
                        {importResult.importedItems.slice(0, 10).map((item) => (
                          <li key={item.id}>
                            {item.item_name} ({item.device_name}/
                            {item.customer_name})
                          </li>
                        ))}
                        {importResult.importedItems.length > 10 && (
                          <li>
                            ...他 {importResult.importedItems.length - 10} 件
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InspectionItemList;
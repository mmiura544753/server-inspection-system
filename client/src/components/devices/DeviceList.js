// src/components/devices/DeviceList.js
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaDownload,
  FaUpload,
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
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  // インポート処理状態の追加
  const [importProgress, setImportProgress] = useState("");

  // ファイル入力用のref
  const fileInputRef = useRef(null);

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

      // deviceAPI経由でインポート実行（5秒ごとにUIメッセージを更新）
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
      const response = await deviceAPI.importData(file);
      console.log("インポート完了 - レスポンス:", response);

      // タイマーをクリア
      clearTimeout(progressTimer);

      // 結果を保存
      setImportResult(response.data || response);
      setShowImportResultModal(true);

      // 成功メッセージの表示
      const importedCount =
        response.data?.importedRows || response.importedRows || 0;
      setImportSuccess(`${importedCount}件のデータをインポートしました`);

      // 機器リストを再読み込み
      fetchDevices();
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
          <Link to="/devices/new" className="btn btn-primary">
            <FaPlus className="me-2" /> 新規機器登録
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
            現在の機器一覧をSJIS形式のCSVファイルでダウンロードします。
          </p>
          <p className="mb-0">
            <strong>CSVインポート</strong>:
            CSVファイルから機器情報を一括登録します。ファイル形式はSJISエンコーディングが推奨です。
          </p>
          <p className="small text-muted mt-2">
            インポート用CSVのフォーマット:
            機器名、顧客名、モデル、設置場所、機器種別、ハードウェアタイプのカラムが必要です。
            IDが指定されている場合は更新、指定がない場合は新規作成されます。存在しない顧客名の場合は自動的に新規顧客が作成されます。
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
                          {error.row["機器名"] ||
                            error.row["device_name"] ||
                            "不明な機器"}
                          : {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.importedDevices &&
                  importResult.importedDevices.length > 0 && (
                    <div>
                      <h6>インポートされた機器：</h6>
                      <ul>
                        {importResult.importedDevices
                          .slice(0, 10)
                          .map((device) => (
                            <li key={device.id}>
                              {device.device_name} ({device.customer_name})
                            </li>
                          ))}
                        {importResult.importedDevices.length > 10 && (
                          <li>
                            ...他 {importResult.importedDevices.length - 10} 件
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

export default DeviceList;

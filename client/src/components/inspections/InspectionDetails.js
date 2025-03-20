// src/components/inspections/InspectionDetails.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const InspectionDetails = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 点検データの取得
  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setLoading(true);
        const data = await inspectionAPI.getById(id);
        setInspection(data);
        setError(null);
      } catch (err) {
        setError("点検データの取得に失敗しました。");
        console.error(`点検ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id]);

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("ja-JP", options);
  };

  // 時刻フォーマット
  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // HH:MM 形式で表示
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert type="danger" message={error} />
        <Link to="/inspections" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          点検一覧に戻る
        </Link>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container py-4">
        <Alert type="warning" message="点検データが見つかりません。" />
        <Link to="/inspections" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          点検一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0">点検詳細</h1>
          <div>
            <Link
              to={`/inspections/edit/${id}`}
              className="btn btn-warning me-2"
            >
              <FaEdit className="me-2" />
              編集
            </Link>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-2" />
              削除
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h2 className="h4">基本情報</h2>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th width="30%">点検ID</th>
                    <td>{inspection.id}</td>
                  </tr>
                  <tr>
                    <th>点検日</th>
                    <td>{formatDate(inspection.inspection_date)}</td>
                  </tr>
                  <tr>
                    <th>開始時間</th>
                    <td>{formatTime(inspection.start_time)}</td>
                  </tr>
                  <tr>
                    <th>終了時間</th>
                    <td>{formatTime(inspection.end_time)}</td>
                  </tr>
                  <tr>
                    <th>点検者</th>
                    <td>{inspection.inspector_name}</td>
                  </tr>
                  <tr>
                    <th>登録日時</th>
                    <td>
                      {new Date(inspection.created_at).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="h4">点検結果</h2>
            {inspection.results && inspection.results.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ラックNo.</th>
                      <th>ユニット</th>
                      <th>サーバ名</th>
                      <th>機種</th>
                      <th>点検項目</th>
                      <th>点検結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspection.results.map((result) => (
                      <tr key={result.id}>
                        <td>{result.rack_number || '-'}</td>
                        <td>{result.unit_position || '-'}</td>
                        <td>{result.device_name || '-'}</td>
                        <td>{result.model || '-'}</td>
                        <td>{result.check_item}</td>
                        <td>
                          <span
                            className={`badge ${result.status === "正常" ? "bg-success" : "bg-danger"}`}
                          >
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">点検結果がありません。</div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <Link to="/inspections" className="btn btn-secondary">
            <FaArrowLeft className="me-2" />
            点検一覧に戻る
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="点検削除の確認"
        onConfirm={async () => {
          try {
            await inspectionAPI.delete(id);
            window.location.href = "/inspections";
          } catch (err) {
            setError("点検の削除に失敗しました。");
            setShowDeleteModal(false);
          }
        }}
      >
        <p>点検ID「{inspection.id}」の記録を削除してもよろしいですか？</p>
        <p className="text-danger">
          削除すると、この点検に関連するすべての詳細データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionDetails;

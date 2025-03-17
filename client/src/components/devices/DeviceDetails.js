// src/components/devices/DeviceDetails.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import { deviceAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const DeviceDetails = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 機器データの取得
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        const data = await deviceAPI.getById(id);
        setDevice(data);
        setError(null);
      } catch (err) {
        setError("機器データの取得に失敗しました。");
        console.error(`機器ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert type="danger" message={error} />
        <Link to="/devices" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          機器一覧に戻る
        </Link>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="container py-4">
        <Alert type="warning" message="機器が見つかりません。" />
        <Link to="/devices" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          機器一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0">機器詳細</h1>
          <div>
            <Link to={`/devices/edit/${id}`} className="btn btn-warning me-2">
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
                    <th width="30%">機器ID</th>
                    <td>{device.id}</td>
                  </tr>
                  <tr>
                    <th>機器名</th>
                    <td>{device.device_name}</td>
                  </tr>
                  <tr>
                    <th>顧客</th>
                    <td>{device.customer_name}</td>
                  </tr>
                  <tr>
                    <th>モデル</th>
                    <td>{device.model || "-"}</td>
                  </tr>
                  <tr>
                    <th>設置場所</th>
                    <td>{device.rack_number || "-"}</td>
                  </tr>
                  <tr>
                    <th>ユニット位置</th>
                    <td>{device.unit_position || "-"}</td>
                  </tr>
                  <tr>
                    <th>機器種別</th>
                    <td>{device.device_type}</td>
                  </tr>
                  <tr>
                    <th>ハードウェアタイプ</th>
                    <td>{device.hardware_type}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 後で実装する：この機器に関連する点検履歴の表示 */}
          <div className="mt-4">
            <h2 className="h4">点検履歴</h2>
            <div className="alert alert-info">
              この機器の点検履歴は開発中です。点検機能が実装されたら、ここに表示されます。
            </div>
          </div>
        </div>

        <div className="card-footer">
          <Link to="/devices" className="btn btn-secondary">
            <FaArrowLeft className="me-2" />
            機器一覧に戻る
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="機器削除の確認"
        onConfirm={() => {
          // 削除処理。実際のAPIコールは省略（機器一覧ページに任せる）
          window.rack_number.href = "/devices";
        }}
      >
        <p>機器「{device.device_name}」を削除してもよろしいですか？</p>
        <p className="text-danger">
          削除すると、この機器に関連するすべての点検データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default DeviceDetails;

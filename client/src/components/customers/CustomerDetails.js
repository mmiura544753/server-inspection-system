// src/components/customers/CustomerDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaArrowLeft, FaServer } from 'react-icons/fa';
import { customerAPI } from '../../services/api';
import Loading from '../common/Loading';
import Alert from '../common/Alert';
import Modal from '../common/Modal';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 顧客データの取得
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const data = await customerAPI.getById(id);
        setCustomer(data);
        setError(null);
      } catch (err) {
        setError('顧客データの取得に失敗しました。');
        console.error(`顧客ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  // 時刻フォーマット関数
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString('ja-JP', options);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert type="danger" message={error} />
        <Link to="/customers" className="btn btn-primary">
          <FaArrowLeft className="me-2" />顧客一覧に戻る
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container py-4">
        <Alert type="warning" message="顧客が見つかりません。" />
        <Link to="/customers" className="btn btn-primary">
          <FaArrowLeft className="me-2" />顧客一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0">顧客詳細</h1>
          <div>
            <Link to={`/customers/edit/${id}`} className="btn btn-warning me-2">
              <FaEdit className="me-2" />編集
            </Link>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-2" />削除
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
                    <th width="30%">顧客ID</th>
                    <td>{customer.id}</td>
                  </tr>
                  <tr>
                    <th>顧客名</th>
                    <td>{customer.customer_name}</td>
                  </tr>
                  <tr>
                    <th>登録日時</th>
                    <td>{formatDate(customer.created_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 後で実装する：この顧客に関連する機器の一覧表示 */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4">関連機器一覧</h2>
              <Link to={`/devices/new?customer_id=${id}`} className="btn btn-sm btn-primary">
                <FaServer className="me-2" />新規機器登録
              </Link>
            </div>
            
            <div className="alert alert-info">
              この顧客の機器一覧は開発中です。機器管理機能が実装されたら、ここに表示されます。
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <Link to="/customers" className="btn btn-secondary">
            <FaArrowLeft className="me-2" />顧客一覧に戻る
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="顧客削除の確認"
        onConfirm={() => {
          // 削除処理。実際のAPIコールは省略（顧客一覧ページに任せる）
          window.location.href = '/customers';
        }}
      >
        <p>
          顧客「{customer.customer_name}」を削除してもよろしいですか？
        </p>
        <p className="text-danger">
          削除すると、この顧客に関連するすべての機器データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default CustomerDetails;

// src/components/customers/CustomerList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import { customerAPI } from '../../services/api';
import Loading from '../common/Loading';
import Alert from '../common/Alert';
import Modal from '../common/Modal';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // 顧客一覧データの取得
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('顧客データの取得に失敗しました。');
      console.error('顧客一覧取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 削除確認モーダルを表示
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  // 顧客の削除処理
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      await customerAPI.delete(customerToDelete.id);
      
      // 成功したら、顧客リストから削除した顧客を除外
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError('顧客の削除に失敗しました。');
      console.error('顧客削除エラー:', err);
    }
  };

  // 検索フィルター
  const filteredCustomers = customers.filter(customer => 
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">顧客一覧</h1>
        <Link to="/customers/new" className="btn btn-primary">
          <FaPlus className="me-2" /> 新規顧客登録
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
              placeholder="顧客名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 顧客一覧テーブル */}
      {filteredCustomers.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>顧客名</th>
                    <th>登録日時</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.customer_name}</td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="btn btn-sm btn-info"
                            title="詳細"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/customers/edit/${customer.id}`}
                            className="btn btn-sm btn-warning"
                            title="編集"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            title="削除"
                            onClick={() => handleDeleteClick(customer)}
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
          {searchTerm ? '検索条件に一致する顧客はありません。' : '顧客データがありません。'}
        </div>
      )}

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="顧客削除の確認"
        onConfirm={handleDeleteConfirm}
      >
        <p>
          顧客「{customerToDelete?.customer_name}」を削除してもよろしいですか？
        </p>
        <p className="text-danger">
          削除すると、この顧客に関連するすべての機器データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default CustomerList;

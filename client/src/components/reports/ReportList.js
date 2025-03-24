// src/components/reports/ReportList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaDownload, FaPlus, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerFilter, setCustomerFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/reports`);
        setReports(response.data);
        setError(null);
      } catch (err) {
        console.error('レポート取得エラー:', err);
        setError('レポートの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`);
        setCustomers(response.data);
      } catch (err) {
        console.error('顧客取得エラー:', err);
      }
    };

    fetchReports();
    fetchCustomers();
  }, []);

  const handleDownload = async (reportId) => {
    try {
      window.open(`${API_URL}/reports/download/${reportId}`, '_blank');
    } catch (err) {
      console.error('ダウンロードエラー:', err);
      alert('レポートのダウンロードに失敗しました。');
    }
  };

  const getReportTypeName = (type) => {
    switch (type) {
      case 'daily':
        return '日次レポート';
      case 'monthly':
        return '月次レポート';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesCustomer = customerFilter ? report.customer_id.toString() === customerFilter : true;
    const matchesType = typeFilter ? report.report_type === typeFilter : true;
    return matchesCustomer && matchesType;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>レポート一覧</h2>
        <Link to="/reports/generate" className="btn btn-primary">
          <FaPlus className="me-2" />
          新規レポート生成
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">検索フィルター</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="customerFilter" className="form-label">顧客</label>
              <select
                id="customerFilter"
                className="form-select"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <option value="">すべて</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.customer_name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="typeFilter" className="form-label">レポートタイプ</label>
              <select
                id="typeFilter"
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">すべて</option>
                <option value="daily">日次レポート</option>
                <option value="monthly">月次レポート</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <FaSpinner className="fa-spin me-2" />
          読み込み中...
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>顧客</th>
                <th>タイプ</th>
                <th>期間</th>
                <th>生成日</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map(report => {
                  const customer = customers.find(c => c.id === report.customer_id);
                  const customerName = customer ? customer.customer_name : `ID: ${report.customer_id}`;
                  
                  return (
                    <tr key={report.id}>
                      <td>{report.id}</td>
                      <td>{customerName}</td>
                      <td>{getReportTypeName(report.report_type)}</td>
                      <td>{report.report_period}</td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>
                        <span className={`badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                          {report.status === 'completed' ? '完了' : '処理中'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleDownload(report.id)}
                            disabled={report.status !== 'completed'}
                          >
                            <FaDownload className="me-1" /> ダウンロード
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">レポートが見つかりません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportList;
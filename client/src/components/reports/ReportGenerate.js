// src/components/reports/ReportGenerate.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ReportGenerate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    report_type: 'daily',
    report_date: new Date().toISOString().split('T')[0],
    report_period: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).replace('/', '年') + '月', 
    title: '点検報告書',
    template_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [customersResponse, templatesResponse] = await Promise.all([
          axios.get(`${API_URL}/customers`),
          axios.get(`${API_URL}/reports/templates`)
        ]);
        
        setCustomers(customersResponse.data);
        setTemplates(templatesResponse.data);
        
        // デフォルトで最初の顧客とテンプレートを選択
        if (customersResponse.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            customer_id: customersResponse.data[0].id.toString()
          }));
        }
        
        // レポートタイプに合うデフォルトのテンプレートを選択
        const defaultTemplate = templatesResponse.data.find(t => t.type === formData.report_type);
        if (defaultTemplate) {
          setFormData(prev => ({
            ...prev,
            template_id: defaultTemplate.id.toString()
          }));
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        toast.error('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // レポートタイプが変更されたときにテンプレートを更新
  useEffect(() => {
    const defaultTemplate = templates.find(t => t.type === formData.report_type);
    if (defaultTemplate) {
      setFormData(prev => ({
        ...prev,
        template_id: defaultTemplate.id.toString()
      }));
    }
    
    // 日次レポートの場合は日付形式、月次レポートの場合は年月形式にする
    if (formData.report_type === 'daily') {
      setFormData(prev => ({
        ...prev,
        report_period: new Date(prev.report_date).toLocaleDateString('ja-JP')
      }));
    } else if (formData.report_type === 'monthly') {
      const date = new Date(formData.report_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      setFormData(prev => ({
        ...prev,
        report_period: `${year}年${month.toString().padStart(2, '0')}月`
      }));
    }
  }, [formData.report_type, formData.report_date, templates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/reports/generate`, formData);
      
      toast.success('レポート生成を開始しました。レポート一覧から確認できます。');
      navigate('/reports');
    } catch (err) {
      console.error('レポート生成エラー:', err);
      toast.error('レポート生成に失敗しました。');
      setLoading(false);
    }
  };

  const filterTemplatesByType = (type) => {
    return templates.filter(template => template.type === type);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>レポート生成</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="customer_id" className="form-label">顧客 *</label>
              <select
                id="customer_id"
                name="customer_id"
                className="form-select"
                value={formData.customer_id}
                onChange={handleInputChange}
                required
              >
                <option value="">顧客を選択してください</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="report_type" className="form-label">レポートタイプ *</label>
              <select
                id="report_type"
                name="report_type"
                className="form-select"
                value={formData.report_type}
                onChange={handleInputChange}
                required
              >
                <option value="daily">日次レポート</option>
                <option value="monthly">月次レポート</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="report_date" className="form-label">レポート対象日 *</label>
              <input
                type="date"
                id="report_date"
                name="report_date"
                className="form-control"
                value={formData.report_date}
                onChange={handleInputChange}
                required
              />
              <small className="text-muted">
                {formData.report_type === 'monthly' 
                  ? '月次レポートの場合、指定した月の全期間が対象になります。' 
                  : '日次レポートの場合、指定した日付の点検結果が対象になります。'}
              </small>
            </div>

            <div className="mb-3">
              <label htmlFor="report_period" className="form-label">表示期間</label>
              <input
                type="text"
                id="report_period"
                name="report_period"
                className="form-control"
                value={formData.report_period}
                onChange={handleInputChange}
                placeholder="例: 2025年03月 または 2025/03/24"
              />
              <small className="text-muted">
                レポートに表示される期間の文字列です。未指定の場合は自動生成されます。
              </small>
            </div>

            <div className="mb-3">
              <label htmlFor="title" className="form-label">レポートタイトル</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例: サーバー点検報告書"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="template_id" className="form-label">テンプレート *</label>
              <select
                id="template_id"
                name="template_id"
                className="form-select"
                value={formData.template_id}
                onChange={handleInputChange}
                required
              >
                <option value="">テンプレートを選択してください</option>
                {filterTemplatesByType(formData.report_type).map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-secondary me-md-2"
                onClick={() => navigate('/reports')}
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="fa-spin me-2" />
                    処理中...
                  </>
                ) : (
                  <>
                    <FaFileAlt className="me-2" />
                    レポート生成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerate;
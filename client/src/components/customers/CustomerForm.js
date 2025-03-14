// src/components/customers/CustomerForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaSave, FaTimes } from 'react-icons/fa';
import { customerAPI } from '../../services/api';
import Loading from '../common/Loading';
import Alert from '../common/Alert';

// バリデーションスキーマ
const CustomerSchema = Yup.object().shape({
  customer_name: Yup.string()
    .required('顧客名は必須です')
    .max(100, '顧客名は100文字以内で入力してください')
});

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [customer, setCustomer] = useState({
    customer_name: ''
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // 編集モードの場合、既存顧客データを取得
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

    if (isEditMode) {
      fetchCustomer();
    }
  }, [id, isEditMode]);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      console.log('送信するデータ:', values);      

      if (isEditMode) {
        // 既存顧客の更新
        const response = await customerAPI.update(id, values);
        console.log('更新レスポンス:', response);
      } else {
        // 新規顧客の作成
        const response = await customerAPI.create(values);
        console.log('作成レスポンス:', response);
      }

      // 成功したら顧客一覧ページに戻る
      navigate('/customers');
    } catch (err) {
      console.error('エラーの詳細:', err);
      console.error('エラーレスポンス:', err.response ? err.response.data : 'レスポンスなし');
      setSubmitError(`顧客の${isEditMode ? '更新' : '作成'}に失敗しました。${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h3 mb-0">{isEditMode ? '顧客情報の編集' : '新規顧客登録'}</h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}
          
          <Formik
            initialValues={customer}
            validationSchema={CustomerSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form className="form-container">
                <div className="mb-3">
                  <label htmlFor="customer_name" className="form-label required-label">顧客名</label>
                  <Field
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    className="form-control"
                    placeholder="顧客名を入力"
                  />
                  <ErrorMessage name="customer_name" component="div" className="text-danger" />
                </div>
                
                <div className="mt-4 d-flex justify-content-between">
                  <Link to="/customers" className="btn btn-secondary">
                    <FaTimes className="me-2" />キャンセル
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    <FaSave className="me-2" />{isSubmitting ? '保存中...' : '保存する'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;

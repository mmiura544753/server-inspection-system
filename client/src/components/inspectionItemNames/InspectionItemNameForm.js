// src/components/inspectionItemNames/InspectionItemNameForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Loading from '../common/Loading';
import Alert from '../common/Alert';
import { inspectionItemAPI } from '../../services/api';

// バリデーションスキーマ
const ItemNameSchema = Yup.object().shape({
  name: Yup.string()
    .required('点検項目名は必須です')
    .max(255, '点検項目名は255文字以内で入力してください')
});

const InspectionItemNameForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // 状態管理
  const [itemName, setItemName] = useState({ name: '' });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  // 編集モードの場合、既存データを取得
  useEffect(() => {
    const fetchItemName = async () => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.itemNames.getById(id);
        setItemName(data);
        setError(null);
      } catch (err) {
        console.error(`点検項目名ID:${id}の取得エラー:`, err);
        setError('点検項目名の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchItemName();
    }
  }, [id, isEditMode]);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      
      if (isEditMode) {
        await inspectionItemAPI.itemNames.update(id, values);
      } else {
        await inspectionItemAPI.itemNames.create(values);
      }
      
      // 一覧画面に戻る
      navigate('/inspection-item-names');
    } catch (err) {
      console.error(`点検項目名${isEditMode ? '更新' : '作成'}エラー:`, err);
      setError(err.response?.data?.message || `点検項目名の${isEditMode ? '更新' : '作成'}に失敗しました`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h3 mb-0">
            {isEditMode ? '確認作業項目の編集' : '新規確認作業項目登録'}
          </h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          
          <Formik
            initialValues={itemName}
            validationSchema={ItemNameSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label required-label">
                    確認作業項目
                  </label>
                  <Field
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    placeholder="確認作業項目を入力"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-danger"
                  />
                  <div className="form-text">
                    確認作業項目は登録後、点検項目作成時に選択できるようになります。
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/inspection-item-names')}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        処理中...
                      </>
                    ) : (
                      isEditMode ? '更新' : '登録'
                    )}
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

export default InspectionItemNameForm;
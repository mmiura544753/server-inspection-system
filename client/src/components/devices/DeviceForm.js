// src/components/devices/DeviceForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaSave, FaTimes } from "react-icons/fa";
import { deviceAPI, customerAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// バリデーションスキーマ
const DeviceSchema = Yup.object().shape({
  customer_id: Yup.number().required("顧客の選択は必須です"),
  device_name: Yup.string()
    .required("機器名は必須です")
    .max(100, "機器名は100文字以内で入力してください"),
  device_type: Yup.string().required("機器種別は必須です"),
  hardware_type: Yup.string().required("ハードウェアタイプは必須です"),
  model: Yup.string().max(50, "モデル名は50文字以内で入力してください"),
  location: Yup.string().max(100, "設置場所は100文字以内で入力してください"),
  unit_position: Yup.string().max(20, "ユニット位置は20文字以内で入力してください"),
});

const DeviceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [device, setDevice] = useState({
    customer_id: "",
    device_name: "",
    model: "",
    location: "",
    unit_position: "",
    device_type: "サーバ",
    hardware_type: "物理",
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // 顧客一覧を取得
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomerLoading(true);
        const data = await customerAPI.getAll();
        setCustomers(data);
      } catch (err) {
        setError("顧客データの取得に失敗しました。");
        console.error("顧客一覧取得エラー:", err);
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // 編集モードの場合、既存機器データを取得
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

    if (isEditMode) {
      fetchDevice();
    }
  }, [id, isEditMode]);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      if (isEditMode) {
        // 既存機器の更新
        await deviceAPI.update(id, values);
      } else {
        // 新規機器の作成
        await deviceAPI.create(values);
      }

      // 成功したら機器一覧ページに戻る
      navigate("/devices");
    } catch (err) {
      console.error(`機器${isEditMode ? "更新" : "作成"}エラー:`, err);
    // 重複エラーの場合
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes('同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します')) {
          // フォームのフィールドにエラーを表示
          setFieldError('device_name', '同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します');
        } else {
          setSubmitError(err.response.data.message);
        }
      } else {
        setSubmitError(`機器の${isEditMode ? "更新" : "作成"}に失敗しました。`);
      }      
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || customerLoading) {
    return <Loading />;
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h3 mb-0">
            {isEditMode ? "機器情報の編集" : "新規機器登録"}
          </h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}

          <Formik
            initialValues={device}
            validationSchema={DeviceSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, values }) => (
              <Form className="form-container">
                <div className="mb-3">
                  <label
                    htmlFor="customer_id"
                    className="form-label required-label"
                  >
                    顧客
                  </label>
                  <Field
                    as="select"
                    id="customer_id"
                    name="customer_id"
                    className="form-select"
                  >
                    <option value="">顧客を選択してください</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="customer_id"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="device_name"
                    className="form-label required-label"
                  >
                    機器名
                  </label>
                  <Field
                    type="text"
                    id="device_name"
                    name="device_name"
                    className="form-control"
                    placeholder="機器名を入力"
                  />
                  <ErrorMessage
                    name="device_name"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="model" className="form-label">
                    モデル
                  </label>
                  <Field
                    type="text"
                    id="model"
                    name="model"
                    className="form-control"
                    placeholder="モデル名を入力"
                  />
                  <ErrorMessage
                    name="model"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="location" className="form-label">
                    設置場所
                  </label>
                  <Field
                    type="text"
                    id="location"
                    name="location"
                    className="form-control"
                    placeholder="設置場所を入力"
                  />
                  <ErrorMessage
                    name="location"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="unit_position" className="form-label">
                    ユニット位置
                  </label>
                  <Field
                    type="text"
                    id="unit_position"
                    name="unit_position"
                    className="form-control"
                    placeholder="例: U1-U2"
                  />
                  <small className="form-text text-muted">
                    ラックの搭載位置を入力してください（例: U1-U2）
                  </small>
                  <ErrorMessage
                    name="unit_position"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="device_type"
                    className="form-label required-label"
                  >
                    機器種別
                  </label>
                  <Field
                    as="select"
                    id="device_type"
                    name="device_type"
                    className="form-select"
                  >
                    <option value="サーバ">サーバ</option>
                    <option value="UPS">UPS</option>
                    <option value="ネットワーク機器">ネットワーク機器</option>
                    <option value="その他">その他</option>
                  </Field>
                  <ErrorMessage
                    name="device_type"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="hardware_type"
                    className="form-label required-label"
                  >
                    ハードウェアタイプ
                  </label>
                  <Field
                    as="select"
                    id="hardware_type"
                    name="hardware_type"
                    className="form-select"
                  >
                    <option value="物理">物理</option>
                    <option value="VM">VM</option>
                  </Field>
                  <ErrorMessage
                    name="hardware_type"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mt-4 d-flex justify-content-between">
                  <Link to="/devices" className="btn btn-secondary">
                    <FaTimes className="me-2" />
                    キャンセル
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    <FaSave className="me-2" />
                    {isSubmitting ? "保存中..." : "保存する"}
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

export default DeviceForm;

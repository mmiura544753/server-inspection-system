// src/components/inspections/InspectionItemForm.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaSave, FaTimes } from "react-icons/fa";
import { inspectionItemAPI, deviceAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// バリデーションスキーマ
const InspectionItemSchema = Yup.object().shape({
  device_id: Yup.number().required("機器の選択は必須です"),
  item_name: Yup.string()
    .required("点検項目名は必須です")
    .max(255, "点検項目名は255文字以内で入力してください"),
});

const InspectionItemForm = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // 機器一覧を取得
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const data = await deviceAPI.getAll();
        setDevices(data);
      } catch (err) {
        setError("機器データの取得に失敗しました。");
        console.error("機器一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      // 点検項目の作成
      await inspectionItemAPI.create(values);

      // 成功したら点検項目一覧ページに戻る
      navigate("/inspection-items");
    } catch (err) {
      setSubmitError("点検項目の作成に失敗しました。");
      console.error("点検項目作成エラー:", err);
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
          <h1 className="h3 mb-0">新規点検項目登録</h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}

          <Formik
            initialValues={{
              device_id: "",
              item_name: "",
            }}
            validationSchema={InspectionItemSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="form-container">
                <div className="mb-3">
                  <label
                    htmlFor="device_id"
                    className="form-label required-label"
                  >
                    機器
                  </label>
                  <Field
                    as="select"
                    id="device_id"
                    name="device_id"
                    className="form-select"
                  >
                    <option value="">機器を選択してください</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.device_name} ({device.customer_name})
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="device_id"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="item_name"
                    className="form-label required-label"
                  >
                    点検項目名
                  </label>
                  <Field
                    type="text"
                    id="item_name"
                    name="item_name"
                    className="form-control"
                    placeholder="点検項目名を入力"
                  />
                  <ErrorMessage
                    name="item_name"
                    component="div"
                    className="text-danger"
                  />
                </div>

                <div className="mt-4 d-flex justify-content-between">
                  <Link to="/inspection-items" className="btn btn-secondary">
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

export default InspectionItemForm;

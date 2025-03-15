// src/components/inspections/InspectionForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import {
  inspectionAPI,
  deviceAPI,
  inspectionItemAPI,
} from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// バリデーションスキーマ
const InspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("点検日は必須です"),
  inspector_name: Yup.string()
    .required("点検者名は必須です")
    .max(50, "点検者名は50文字以内で入力してください"),
  start_time: Yup.string(),
  end_time: Yup.string(),
  device_id: Yup.number().required("機器の選択は必須です"),
  results: Yup.array()
    .of(
      Yup.object().shape({
        inspection_item_id: Yup.number().required("点検項目の選択は必須です"),
        status: Yup.string().required("結果ステータスは必須です"),
      })
    )
    .min(1, "少なくとも1つの点検結果を入力してください"),
});

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [inspection, setInspection] = useState({
    inspection_date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    inspector_name: "",
    device_id: "",
    results: [],
  });
  const [devices, setDevices] = useState([]);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // 機器一覧を取得
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setDeviceLoading(true);
        const data = await deviceAPI.getAll();
        setDevices(data);
      } catch (err) {
        setError("機器データの取得に失敗しました。");
        console.error("機器一覧取得エラー:", err);
      } finally {
        setDeviceLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // 編集モードの場合、既存点検データを取得
  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setLoading(true);
        const data = await inspectionAPI.getById(id);

        // 日付フォーマット調整
        const formattedDate = new Date(data.inspection_date)
          .toISOString()
          .split("T")[0];

        // 機器IDは最初の結果から取得
        const deviceId =
          data.results && data.results.length > 0
            ? data.results[0].device_id
            : "";

        // 結果データの整形
        const formattedResults = data.results.map((result) => ({
          inspection_item_id: result.inspection_item_id || "",
          status: result.status,
        }));

        setInspection({
          ...data,
          inspection_date: formattedDate,
          device_id: deviceId,
          results: formattedResults,
        });

        // 選択された機器の点検項目を取得
        if (deviceId) {
          fetchInspectionItems(deviceId);
        }

        setError(null);
      } catch (err) {
        setError("点検データの取得に失敗しました。");
        console.error(`点検ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchInspection();
    }
  }, [id, isEditMode]);

  // 機器が選択されたら、その機器の点検項目を取得
  const fetchInspectionItems = async (deviceId) => {
    if (!deviceId) {
      setInspectionItems([]);
      return;
    }

    try {
      const data = await inspectionItemAPI.getByDeviceId(deviceId);
      setInspectionItems(data);
    } catch (err) {
      console.error(`機器ID:${deviceId}の点検項目取得エラー:`, err);
    }
  };

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      if (isEditMode) {
        // 既存点検の更新
        await inspectionAPI.update(id, values);
      } else {
        // 新規点検の作成
        await inspectionAPI.create(values);
      }

      // 成功したら点検一覧ページに戻る
      navigate("/inspections");
    } catch (err) {
      setSubmitError(`点検の${isEditMode ? "更新" : "作成"}に失敗しました。`);
      console.error(`点検${isEditMode ? "更新" : "作成"}エラー:`, err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || deviceLoading) {
    return <Loading />;
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h3 mb-0">
            {isEditMode ? "点検情報の編集" : "新規点検登録"}
          </h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}

          <Formik
            initialValues={inspection}
            validationSchema={InspectionSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, isSubmitting, setFieldValue }) => (
              <Form className="form-container">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label
                      htmlFor="inspection_date"
                      className="form-label required-label"
                    >
                      点検日
                    </label>
                    <Field
                      type="date"
                      id="inspection_date"
                      name="inspection_date"
                      className="form-control"
                    />
                    <ErrorMessage
                      name="inspection_date"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="start_time" className="form-label">
                      開始時間
                    </label>
                    <Field
                      type="time"
                      id="start_time"
                      name="start_time"
                      className="form-control"
                    />
                    <ErrorMessage
                      name="start_time"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="end_time" className="form-label">
                      終了時間
                    </label>
                    <Field
                      type="time"
                      id="end_time"
                      name="end_time"
                      className="form-control"
                    />
                    <ErrorMessage
                      name="end_time"
                      component="div"
                      className="text-danger"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="inspector_name"
                    className="form-label required-label"
                  >
                    点検者名
                  </label>
                  <Field
                    type="text"
                    id="inspector_name"
                    name="inspector_name"
                    className="form-control"
                    placeholder="点検者名を入力"
                  />
                  <ErrorMessage
                    name="inspector_name"
                    component="div"
                    className="text-danger"
                  />
                </div>

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
                    onChange={async (e) => {
                      const deviceId = e.target.value;
                      setFieldValue("device_id", deviceId);
                      setFieldValue("results", []); // 機器変更時は結果をクリア
                      await fetchInspectionItems(deviceId);
                    }}
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

                <h3 className="h5 mt-4">点検結果</h3>
                <ErrorMessage
                  name="results"
                  component="div"
                  className="text-danger"
                />

                {values.device_id && inspectionItems.length > 0 ? (
                  <FieldArray name="results">
                    {({ push, remove }) => (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>点検項目</th>
                              <th width="150">結果</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inspectionItems.map((item, index) => {
                              // この点検項目が既に結果リストに含まれているか確認
                              const resultIndex = values.results.findIndex(
                                (r) => r.inspection_item_id === item.id
                              );

                              // 含まれていなければ追加
                              if (resultIndex === -1) {
                                push({
                                  inspection_item_id: item.id,
                                  status: "正常",
                                });
                              }

                              // 現在の結果インデックスを再計算
                              const currentIndex = values.results.findIndex(
                                (r) => r.inspection_item_id === item.id
                              );

                              return (
                                <tr key={item.id}>
                                  <td>{item.item_name}</td>
                                  <td>
                                    {currentIndex !== -1 && (
                                      <Field
                                        as="select"
                                        name={`results.${currentIndex}.status`}
                                        className="form-select"
                                      >
                                        <option value="正常">正常</option>
                                        <option value="異常">異常</option>
                                      </Field>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </FieldArray>
                ) : (
                  <div className="alert alert-warning">
                    {values.device_id
                      ? "選択された機器に点検項目がありません。先に点検項目を登録してください。"
                      : "機器を選択してください。"}
                  </div>
                )}

                <div className="mt-4 d-flex justify-content-between">
                  <Link to="/inspections" className="btn btn-secondary">
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

export default InspectionForm;

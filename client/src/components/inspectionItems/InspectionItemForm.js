// src/components/inspectionItems/InspectionItemForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaSave, FaTimes } from "react-icons/fa";
import { inspectionItemAPI, deviceAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Select from 'react-select'; // react-selectをインポート

// バリデーションスキーマ
const InspectionItemSchema = Yup.object().shape({
  device_id: Yup.number().required("機器の選択は必須です"),
  item_name: Yup.string()
    .required("点検項目名は必須です")
    .max(255, "点検項目名は255文字以内で入力してください"),
});

const InspectionItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [item, setItem] = useState({
    device_id: "",
    item_name: "",
  });
  const [deviceOptions, setDeviceOptions] = useState([]);
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
        
        console.log("APIから取得した機器データ:", data);

        // APIから取得したデータをreact-select用の形式に変換
        const options = data.map(device => ({
          value: device.id,
          label: `${device.device_name} (${device.customer_name || '顧客なし'})`
        }));

        console.log("react-select用に変換したオプション:", options);

        setDeviceOptions(options);
      } catch (err) {
        setError("機器データの取得に失敗しました。");
        console.error("機器一覧取得エラー:", err);
      } finally {
        setDeviceLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // 編集モードの場合、既存点検項目データを取得
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.getById(id);
        setItem({
          device_id: data.device_id,
          item_name: data.item_name,
        });
        setError(null);
      } catch (err) {
        setError("点検項目データの取得に失敗しました。");
        console.error(`点検項目ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchItem();
    }
  }, [id, isEditMode]);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      if (isEditMode) {
        // 既存点検項目の更新
        await inspectionItemAPI.update(id, values);
      } else {
        // 新規点検項目の作成
        await inspectionItemAPI.create(values);
      }

      // 成功したら点検項目一覧ページに戻る
      navigate("/inspection-items");
    } catch (err) {
      setSubmitError(
        `点検項目の${isEditMode ? "更新" : "作成"}に失敗しました。`
      );
      console.error(`点検項目${isEditMode ? "更新" : "作成"}エラー:`, err);
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
            {isEditMode ? "点検項目の編集" : "新規点検項目登録"}
          </h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}

          <Formik
            initialValues={item}
            validationSchema={InspectionItemSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue, values, errors, touched }) => (
              <Form className="form-container">
                <div className="mb-3">
                  <label
                    htmlFor="device_id"
                    className="form-label required-label"
                  >
                    機器
                  </label>
                  
                  {/* ここでreact-selectを使用 */}
                  <Select
                    inputId="device_id"
                    name="device_id"
                    options={deviceOptions}
                    // value={deviceOptions.find(option => option.value === parseInt(values.device_id))}
                    value={deviceOptions.find(option => {
                      console.log("現在の値:", values.device_id, "オプション:", option.value);
                      return option.value === parseInt(values.device_id);
                    })}
                    onChange={(selectedOption) => {
                      setFieldValue("device_id", selectedOption ? selectedOption.value : "");
                    }}
                    placeholder="機器を選択してください"
                    noOptionsMessage={() => "該当する機器がありません"}
                    isSearchable={true}
                    isClearable={true}
                  />
                  
                  {errors.device_id && touched.device_id && (
                    <div className="text-danger">{errors.device_id}</div>
                  )}
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
// src/components/devices/DeviceForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { deviceAPI, customerAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// フォームコンポーネントをインポート
import DeviceBasicInfoForm from "./forms/DeviceBasicInfoForm";
import DeviceLocationForm from "./forms/DeviceLocationForm";
import DeviceTypeForm from "./forms/DeviceTypeForm";
import FormActionButtons from "./forms/FormActionButtons";

// バリデーションスキーマも更新:
const DeviceSchema = Yup.object().shape({
  customer_id: Yup.number().required("顧客の選択は必須です"),
  device_name: Yup.string()
    .required("機器名は必須です")
    .max(100, "機器名は100文字以内で入力してください"),
  device_type: Yup.string().required("機器種別は必須です"),
  hardware_type: Yup.string().required("ハードウェアタイプは必須です"),
  model: Yup.string().max(50, "モデル名は50文字以内で入力してください"),
  rack_number: Yup.number()
    .integer("ラックNo.は整数で入力してください")
    .positive("ラックNo.は正の数を入力してください")
    .nullable(),
  unit_start_position: Yup.number()
    .integer("ユニット開始位置は整数で入力してください")
    .min(1, "ユニット開始位置は1以上の値を入力してください")
    .max(99, "ユニット開始位置は99以下の値を入力してください")
    .nullable(),
  unit_end_position: Yup.number()
    .integer("ユニット終了位置は整数で入力してください")
    .min(1, "ユニット終了位置は1以上の値を入力してください")
    .max(99, "ユニット終了位置は99以下の値を入力してください")
    .nullable()
    .test(
      "greater-than-start",
      "ユニット終了位置は開始位置以上である必要があります",
      function (value) {
        const { unit_start_position } = this.parent;
        if (!value || !unit_start_position) return true;
        return value >= unit_start_position;
      }
    ),
});

const DeviceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [device, setDevice] = useState({
    customer_id: "",
    device_name: "",
    model: "",
    rack_number: "",
    unit_start_position: "",
    unit_end_position: "",
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
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
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
        if (
          err.response.data.message.includes(
            "同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します"
          )
        ) {
          // フォームのフィールドにエラーを表示
          setFieldError(
            "device_name",
            "同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します"
          );
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
                <DeviceBasicInfoForm customers={customers} />
                <DeviceLocationForm />
                <DeviceTypeForm />
                <FormActionButtons isSubmitting={isSubmitting} />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default DeviceForm;

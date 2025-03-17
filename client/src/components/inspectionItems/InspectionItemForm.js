// src/components/inspectionItems/InspectionItemForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaSave, FaTimes, FaInfoCircle } from "react-icons/fa";
import { inspectionItemAPI, deviceAPI, customerAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Select from 'react-select';

// バリデーションスキーマ
const InspectionItemSchema = Yup.object().shape({
  customer_id: Yup.number().required("顧客の選択は必須です"),
  location: Yup.string().nullable(),
  device_id: Yup.number().required("機器の選択は必須です"),
  item_name: Yup.string()
    .required("点検項目名は必須です")
    .max(255, "点検項目名は255文字以内で入力してください"),
});

const InspectionItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // フォームの初期値
  const [item, setItem] = useState({
    customer_id: "",
    location: "",
    device_id: "",
    item_name: "",
  });

  // 各種データの状態管理
  const [customerOptions, setCustomerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [allDevices, setAllDevices] = useState([]); // すべての機器データを保持
  
  // ローディング状態
  const [loading, setLoading] = useState(isEditMode);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [deviceLoading, setDeviceLoading] = useState(true);
  
  // エラー状態
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // 顧客一覧を取得
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomerLoading(true);
        const data = await customerAPI.getAll();
        
        // APIから取得したデータをreact-select用の形式に変換
        const options = data.map(customer => ({
          value: customer.id,
          label: customer.customer_name
        }));

        setCustomerOptions(options);
      } catch (err) {
        setError("顧客データの取得に失敗しました。");
        console.error("顧客一覧取得エラー:", err);
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // 機器一覧を取得
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setDeviceLoading(true);
        const data = await deviceAPI.getAll();
        
        // すべての機器データを保存
        setAllDevices(data);
        
        // 初期状態では機器選択肢は空
        setDeviceOptions([]);
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
    const fetchItemData = async () => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.getById(id);
        
        // 機器データから顧客IDと設置場所を取得
        if (allDevices.length > 0) {
          const deviceData = allDevices.find(d => d.id === data.device_id);
          if (deviceData) {
            setItem({
              customer_id: deviceData.customer_id,
              location: deviceData.location || "",
              device_id: data.device_id,
              item_name: data.item_name,
            });
            
            // 設置場所のオプションを更新
            updateLocationOptions(deviceData.customer_id);
            
            // 機器のオプションを更新
            updateDeviceOptions(deviceData.customer_id, deviceData.location || "");
          } else {
            setItem({
              device_id: data.device_id,
              item_name: data.item_name,
            });
          }
        } else {
          setItem({
            device_id: data.device_id,
            item_name: data.item_name,
          });
        }
        
        setError(null);
      } catch (err) {
        setError("点検項目データの取得に失敗しました。");
        console.error(`点検項目ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode && allDevices.length > 0) {
      fetchItemData();
    }
  }, [id, isEditMode, allDevices]);

  // 顧客が選択された時に設置場所の選択肢を更新する関数
  const updateLocationOptions = (customerId) => {
    if (!customerId) {
      setLocationOptions([]);
      return;
    }

    // 選択された顧客に関連する機器から設置場所の一覧を抽出
    const customerDevices = allDevices.filter(device => device.customer_id === parseInt(customerId));
    
    // 重複のない設置場所のリストを作成
    const uniqueLocations = [...new Set(customerDevices.map(device => device.location).filter(Boolean))];
    
    const options = uniqueLocations.map(location => ({
      value: location,
      label: location
    }));
    
    // 「すべて」のオプションを追加
    options.unshift({ value: "", label: "すべての設置場所" });
    
    setLocationOptions(options);
  };

  // 顧客と設置場所に基づいて機器の選択肢を更新する関数
  const updateDeviceOptions = (customerId, location) => {
    if (!customerId) {
      setDeviceOptions([]);
      return;
    }

    // 選択された顧客の機器をフィルタリング
    let filteredDevices = allDevices.filter(device => 
      device.customer_id === parseInt(customerId)
    );
    
    // 設置場所が選択されている場合はさらにフィルタリング
    if (location) {
      filteredDevices = filteredDevices.filter(device => 
        device.location === location
      );
    }
    
    // 機器の選択肢を更新
    const options = filteredDevices.map(device => ({
      value: device.id,
      label: device.device_name + (device.model ? ` (${device.model})` : '')
    }));
    
    setDeviceOptions(options);
  };

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      // customer_idとlocationはAPIに送信しない
      const { customer_id, location, ...submitData } = values;

      if (isEditMode) {
        // 既存点検項目の更新
        await inspectionItemAPI.update(id, submitData);
      } else {
        // 新規点検項目の作成
        await inspectionItemAPI.create(submitData);
      }

      // 成功したら点検項目一覧ページに戻る
      navigate("/inspection-items");
    } catch (err) {
      // エラーメッセージを取得
      let errorMessage = `点検項目の${isEditMode ? "更新" : "作成"}に失敗しました。`;
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSubmitError(errorMessage);
      console.error(`点検項目${isEditMode ? "更新" : "作成"}エラー:`, err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || customerLoading || deviceLoading) {
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
                {/* 顧客選択 */}
                <div className="mb-3">
                  <label
                    htmlFor="customer_id"
                    className="form-label required-label"
                  >
                    顧客名
                  </label>
                  
                  <Select
                    inputId="customer_id"
                    name="customer_id"
                    options={customerOptions}
                    value={customerOptions.find(option => option.value === parseInt(values.customer_id, 10) || 0)}
                    onChange={(selectedOption) => {
                      // 顧客が変更されたら機器もリセット
                      setFieldValue("customer_id", selectedOption ? selectedOption.value : "");
                      setFieldValue("location", "");
                      setFieldValue("device_id", "");
                      
                      // 選択肢を更新
                      if (selectedOption) {
                        updateLocationOptions(selectedOption.value);
                        updateDeviceOptions(selectedOption.value, "");
                      } else {
                        setLocationOptions([]);
                        setDeviceOptions([]);
                      }
                    }}
                    placeholder="顧客を選択してください"
                    noOptionsMessage={() => "該当する顧客がありません"}
                    isSearchable={true}
                    isClearable={true}
                    classNamePrefix="select"
                    // Bootstrapに近いスタイルを適用
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#80bdff' : 
                                     (errors.customer_id && touched.customer_id) ? '#dc3545' : '#ced4da',
                        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                        '&:hover': {
                          borderColor: state.isFocused ? '#80bdff' : '#ced4da'
                        }
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : null,
                        color: state.isSelected ? 'white' : 'black'
                      })
                    }}
                  />
                  
                  {errors.customer_id && touched.customer_id && (
                    <div className="text-danger">{errors.customer_id}</div>
                  )}
                </div>

                {/* 設置場所選択 */}
                <div className="mb-3">
                  <label htmlFor="location" className="form-label">
                    設置場所
                  </label>
                  
                  <Select
                    inputId="location"
                    name="location"
                    options={locationOptions}
                    value={locationOptions.find(option => option.value === values.location)}
                    onChange={(selectedOption) => {
                      setFieldValue("location", selectedOption ? selectedOption.value : "");
                      setFieldValue("device_id", "");
                      
                      // 機器の選択肢を更新
                      updateDeviceOptions(values.customer_id, selectedOption ? selectedOption.value : "");
                    }}
                    placeholder="設置場所を選択してください"
                    noOptionsMessage={() => values.customer_id ? "設置場所がありません" : "先に顧客を選択してください"}
                    isSearchable={true}
                    isClearable={true}
                    isDisabled={!values.customer_id}
                    classNamePrefix="select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                        '&:hover': {
                          borderColor: state.isFocused ? '#80bdff' : '#ced4da'
                        }
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : null,
                        color: state.isSelected ? 'white' : 'black'
                      })
                    }}
                  />
                </div>

                {/* 機器選択 */}
                <div className="mb-3">
                  <label
                    htmlFor="device_id"
                    className="form-label required-label"
                  >
                    機器
                  </label>
                  
                  <Select
                    inputId="device_id"
                    name="device_id"
                    options={deviceOptions}
                    value={deviceOptions.find(option => option.value === parseInt(values.device_id, 10) || 0)}
                    onChange={(selectedOption) => {
                      setFieldValue("device_id", selectedOption ? selectedOption.value : "");
                    }}
                    placeholder="機器を選択してください"
                    noOptionsMessage={() => {
                      if (!values.customer_id) return "先に顧客を選択してください";
                      return "該当する機器がありません";
                    }}
                    isSearchable={true}
                    isClearable={true}
                    isDisabled={!values.customer_id}
                    classNamePrefix="select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#80bdff' : 
                                    (errors.device_id && touched.device_id) ? '#dc3545' : '#ced4da',
                        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                        '&:hover': {
                          borderColor: state.isFocused ? '#80bdff' : '#ced4da'
                        }
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : null,
                        color: state.isSelected ? 'white' : 'black'
                      })
                    }}
                  />
                  
                  {errors.device_id && touched.device_id && (
                    <div className="text-danger">{errors.device_id}</div>
                  )}
                  
                  {/* 機器がない場合のヘルプテキスト */}
                  {values.customer_id && deviceOptions.length === 0 && (
                    <div className="form-text text-info mt-2">
                      <FaInfoCircle className="me-1" />
                      登録したい機器が見つかりません。先に機器マスタに機器を登録してください。
                    </div>
                  )}
                </div>

                {/* 点検項目名 */}
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
                    className={`form-control ${errors.item_name && touched.item_name ? 'is-invalid' : ''}`}
                    placeholder="点検項目名を入力"
                  />
                  <ErrorMessage
                    name="item_name"
                    component="div"
                    className="text-danger"
                  />
                </div>

                {/* アクションボタン */}
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
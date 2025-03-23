// src/hooks/useInspectionItemForm.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionItemAPI, deviceAPI, customerAPI } from '../services/api';

export function useInspectionItemForm(id) {
  const navigate = useNavigate();
  const isEditMode = !!id;

  // 状態管理
  const [item, setItem] = useState({
    customer_id: "",
    location: "",
    device_id: "",
    device_type: "", // 機器種別を追加
    item_names: [],
  });
  const [customerOptions, setCustomerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [deviceTypeOptions, setDeviceTypeOptions] = useState([]); // 機器種別の選択肢
  const [allDevices, setAllDevices] = useState([]);
  
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
        setAllDevices(data);
        setDeviceOptions([]);
        
        // デバイスタイプの選択肢を抽出
        const uniqueDeviceTypes = [...new Set(data.map(device => device.device_type).filter(Boolean))];
        const typeOptions = uniqueDeviceTypes.map(type => ({
          value: type,
          label: type
        }));
        
        setDeviceTypeOptions(typeOptions);
      } catch (err) {
        setError("機器データの取得に失敗しました。");
        console.error("機器一覧取得エラー:", err);
      } finally {
        setDeviceLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // 顧客が選択された時に設置場所の選択肢を更新する関数
  const updateLocationOptions = useCallback((customerId) => {
    if (!customerId) {
      setLocationOptions([]);
      return;
    }

    const customerDevices = allDevices.filter(device => device.customer_id === parseInt(customerId));
    const uniqueLocations = [...new Set(customerDevices.map(device => 
      device.rack_number
    ).filter(Boolean))];
    
    const options = uniqueLocations.map(location => ({
      value: location.toString(), // 数値の場合は文字列に変換
      label: `ラックNo.${location}`
    }));
    
    // 「すべての設置場所」オプションは削除
    setLocationOptions(options);
  }, [allDevices]);

  // 顧客、設置場所、機器種別に基づいて機器の選択肢を更新する関数
  const updateDeviceOptions = useCallback((customerId, location, deviceType) => {
    if (!customerId) {
      setDeviceOptions([]);
      return;
    }

    let filteredDevices = allDevices.filter(device => 
      device.customer_id === parseInt(customerId)
    );
    
    // locationがnullの場合は絞り込まない（すべて表示）
    // 空文字列("")は削除された「すべての設置場所」からの下位互換性のため
    if (location && location !== "") {
      filteredDevices = filteredDevices.filter(device => 
        device.rack_number && device.rack_number.toString() === location
      );
    }
    
    if (deviceType) {
      filteredDevices = filteredDevices.filter(device => 
        device.device_type === deviceType
      );
    }
    
    // 同じサーバーが複数表示されるのを防止するため、重複を排除
    const uniqueDevices = [];
    const uniqueDeviceNames = new Set();
    
    filteredDevices.forEach(device => {
      // 機器名で重複チェック（モデルは考慮しない）
      if (!uniqueDeviceNames.has(device.device_name)) {
        uniqueDeviceNames.add(device.device_name);
        uniqueDevices.push(device);
      }
    });
    
    const options = uniqueDevices.map(device => ({
      value: device.id,
      label: device.device_name + (device.model ? ` (${device.model})` : '')
    }));
    
    setDeviceOptions(options);
  }, [allDevices]);

  // 編集モードの場合、既存点検項目データを取得
  useEffect(() => {
    const fetchItemData = async () => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.getById(id);
        
        // デバイス情報を先に取得する
        const deviceData = await deviceAPI.getById(data.device_id);
        
        // 得られた情報から初期値を設定
        setItem({
          customer_id: deviceData.customer_id,
          location: deviceData.rack_number ? deviceData.rack_number.toString() : "",
          device_id: data.device_id,
          device_type: deviceData.device_type || "", // デバイスタイプを設定
          item_names: [data.item_name], // 編集時は既存の確認作業項目を配列に変換
        });
        
        // ロケーションと機器の選択肢を更新
        updateLocationOptions(deviceData.customer_id);
        updateDeviceOptions(
          deviceData.customer_id, 
          deviceData.rack_number ? deviceData.rack_number.toString() : "",
          deviceData.device_type
        );
      
        setError(null);
      } catch (err) {
        setError("点検項目データの取得に失敗しました。");
        console.error(`点検項目ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchItemData();
    }
  }, [id, isEditMode, updateLocationOptions, updateDeviceOptions]);

  // フォーム送信処理
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitError(null);

      console.log("送信前の値:", values);
      
      // 必須フィールドの確認
      if (!values.device_id) {
        setSubmitError("機器の選択は必須です");
        setSubmitting(false);
        return;
      }
      
      if (!values.item_names || values.item_names.length === 0) {
        setSubmitError("少なくとも1つの確認作業項目を選択または入力してください");
        setSubmitting(false);
        return;
      }
      
      // 編集モードの場合は単一のアイテムの更新のみ
      if (isEditMode) {
        // device_idが文字列型の場合は数値型に変換（APIが数値を期待している場合）
        const submitData = {
          device_id: parseInt(values.device_id, 10),
          item_name: values.item_names[0], // 編集モードでは最初の確認作業項目のみ使用
        };
        
        console.log("送信データ (編集モード):", submitData);
        await inspectionItemAPI.update(id, submitData);
      } else {
        // 作成モードでは各項目名について個別に作成APIを呼び出す
        // 重複エラーがあっても処理を継続するために、エラーハンドリングを追加
        const deviceId = parseInt(values.device_id, 10);
        const results = [];
        const duplicates = [];
        
        // 一つずつ処理して、エラーがあっても継続する
        for (const itemName of values.item_names) {
          const submitData = {
            device_id: deviceId,
            item_name: itemName,
          };
          console.log("送信データ (作成モード):", submitData);
          
          try {
            const result = await inspectionItemAPI.create(submitData);
            results.push(result);
          } catch (error) {
            // エラーメッセージをチェックして重複の場合は無視する
            if (error.response && 
                error.response.data && 
                error.response.data.message && 
                error.response.data.message.includes("同じ機器に対して同じ点検項目名がすでに存在します")) {
              console.log(`重複アイテムをスキップ: ${itemName}`);
              duplicates.push(itemName);
            } else {
              // 重複以外のエラーは再スロー
              throw error;
            }
          }
        }
        
        // 重複があった場合は警告メッセージを表示（オプション）
        if (duplicates.length > 0) {
          console.warn(`${duplicates.length}個の項目が既に存在しています。`, duplicates);
        }
      }

      navigate("/inspection-items");
    } catch (err) {
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

  return {
    isEditMode,
    item,
    customerOptions,
    locationOptions,
    deviceOptions,
    deviceTypeOptions,
    loading: loading || customerLoading || deviceLoading,
    error,
    submitError,
    updateLocationOptions,
    updateDeviceOptions,
    handleSubmit
  };
}
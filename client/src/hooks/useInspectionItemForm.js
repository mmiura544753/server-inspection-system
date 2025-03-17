// src/hooks/useInspectionItemForm.js
import { useState, useEffect } from 'react';
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
    item_name: "",
  });
  const [customerOptions, setCustomerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
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
        
        if (allDevices.length > 0) {
          const deviceData = allDevices.find(d => d.id === data.device_id);
          if (deviceData) {
            setItem({
              customer_id: deviceData.customer_id,
              location: deviceData.location || "",
              device_id: data.device_id,
              item_name: data.item_name,
            });
            
            updateLocationOptions(deviceData.customer_id);
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

    const customerDevices = allDevices.filter(device => device.customer_id === parseInt(customerId));
    const uniqueLocations = [...new Set(customerDevices.map(device => device.location).filter(Boolean))];
    
    const options = uniqueLocations.map(location => ({
      value: location,
      label: location
    }));
    
    options.unshift({ value: "", label: "すべての設置場所" });
    
    setLocationOptions(options);
  };

  // 顧客と設置場所に基づいて機器の選択肢を更新する関数
  const updateDeviceOptions = (customerId, location) => {
    if (!customerId) {
      setDeviceOptions([]);
      return;
    }

    let filteredDevices = allDevices.filter(device => 
      device.customer_id === parseInt(customerId)
    );
    
    if (location) {
      filteredDevices = filteredDevices.filter(device => 
        device.location === location
      );
    }
    
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

      const { customer_id, location, ...submitData } = values;

      if (isEditMode) {
        await inspectionItemAPI.update(id, submitData);
      } else {
        await inspectionItemAPI.create(submitData);
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
    loading: loading || customerLoading || deviceLoading,
    error,
    submitError,
    updateLocationOptions,
    updateDeviceOptions,
    handleSubmit
  };
}
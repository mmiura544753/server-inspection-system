// src/components/inspectionItems/forms/DeviceSelect.js
import React, { useState, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const DeviceSelect = ({ 
  deviceOptions, 
  value, 
  onChange, 
  isDisabled,
  hasCustomer,
  errors, 
  touched 
}) => {
  // 単純に選択された値を保持する要素
  const [selectedElement, setSelectedElement] = useState(null);
  
  // Reactの状態に依存しないDOM操作による選択メソッド
  const selectDevice = (element, optionValue) => {
    // 以前の選択を解除
    if (selectedElement) {
      selectedElement.classList.remove('bg-primary', 'text-white');
    }
    
    // 新しい選択を設定
    if (element) {
      element.classList.add('bg-primary', 'text-white');
      setSelectedElement(element);
      
      // 親コンポーネントにオブジェクト形式で通知
      const option = deviceOptions.find(opt => opt.value === optionValue);
      if (option) {
        onChange(option);
      }
    }
  };

  return (
    <div className="mb-3">
      <label
        className="form-label required-label"
      >
        機器
      </label>
      
      {isDisabled ? (
        <div className="text-muted">先に顧客を選択してください</div>
      ) : deviceOptions.length === 0 ? (
        <div className="text-muted">該当する機器がありません</div>
      ) : (
        <>
          {/* 非表示のフォーム要素 - Formikとの連携用 */}
          <input 
            type="hidden" 
            id="device_id" 
            name="device_id" 
            value={value ? value.value : ''} 
          />
          
          {/* カスタムリストボックス - 見た目のみ */}
          <div 
            className={`form-control ${errors && touched ? 'is-invalid' : ''}`}
            style={{ 
              height: `${Math.min(10, deviceOptions.length) * 2.5}rem`,
              overflow: 'auto',
              padding: 0
            }}
          >
            {deviceOptions.map((option) => (
              <div
                key={option.value}
                className={`py-2 px-3 ${value && value.value === option.value ? 'bg-primary text-white' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => selectDevice(e.currentTarget, option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </>
      )}
      
      {errors && touched && (
        <div className="text-danger">{errors}</div>
      )}
      
      {/* 機器がない場合のヘルプテキスト */}
      {hasCustomer && deviceOptions.length === 0 && (
        <div className="form-text text-info mt-2">
          <FaInfoCircle className="me-1" />
          登録したい機器が見つかりません。先に機器マスタに機器を登録してください。
        </div>
      )}
    </div>
  );
};

export default DeviceSelect;
// src/components/inspectionItems/forms/DeviceTypeSelect.js
import React from 'react';

const DeviceTypeSelect = ({ 
  deviceTypeOptions, 
  value, 
  onChange, 
  isDisabled 
}) => {
  // ラジオボタンのchangeハンドラ
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-3">
      <label className="form-label d-block">種別</label>
      
      {isDisabled ? (
        <div className="text-muted">先に顧客を選択してください</div>
      ) : deviceTypeOptions.length === 0 ? (
        <div className="text-muted">種別がありません</div>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="device_type"
              id="device_type_all"
              value=""
              checked={!value}
              onChange={handleChange}
              disabled={isDisabled}
            />
            <label className="form-check-label" htmlFor="device_type_all">
              すべて
            </label>
          </div>
          
          {deviceTypeOptions.map((option, index) => (
            <div className="form-check" key={index}>
              <input
                className="form-check-input"
                type="radio"
                name="device_type"
                id={`device_type_${index}`}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                disabled={isDisabled}
              />
              <label className="form-check-label" htmlFor={`device_type_${index}`}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceTypeSelect;
// src/components/inspectionItems/forms/LocationSelect.js
import React from 'react';

const LocationSelect = ({ 
  locationOptions, 
  value, 
  onChange, 
  isDisabled 
}) => {
  // 選択された値の取得
  const selectedValue = value ? value.value : '';

  // セレクトボックスのchangeハンドラ
  const handleSelectChange = (e) => {
    const selectedOption = locationOptions.find(option => option.value === e.target.value) || null;
    onChange(selectedOption);
  };

  return (
    <div className="mb-3">
      <label className="form-label d-block" htmlFor="location-select">
        設置ラックNo.
      </label>
      
      {isDisabled ? (
        <div className="text-muted">先に顧客を選択してください</div>
      ) : locationOptions.length === 0 ? (
        <div className="text-muted">設置場所がありません</div>
      ) : (
        <select
          id="location-select"
          className="form-select"
          value={selectedValue}
          onChange={handleSelectChange}
          disabled={isDisabled}
          size={Math.min(5, locationOptions.length)} // 最大5行、それ以下ならその数だけ表示
          style={{ width: '100%' }}
        >
          {locationOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default LocationSelect;
// src/components/inspectionItems/forms/LocationSelect.js
import React from 'react';
import { Field } from 'formik';

const LocationSelect = ({ 
  locationOptions, 
  value, 
  onChange, 
  isDisabled 
}) => {
  // 選択された値の取得
  const selectedValue = value ? value.value : '';

  // ラジオボタンのchangeハンドラ
  const handleRadioChange = (e) => {
    const selectedOption = locationOptions.find(option => option.value === e.target.value) || null;
    onChange(selectedOption);
  };

  return (
    <div className="mb-3">
      <label className="form-label d-block">
        設置ラックNo.
      </label>
      
      <div className="location-list border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {isDisabled ? (
          <div className="text-muted">先に顧客を選択してください</div>
        ) : locationOptions.length === 0 ? (
          <div className="text-muted">設置場所がありません</div>
        ) : (
          <div className="row">
            {locationOptions.map((option, index) => (
              <div className="col-md-4 mb-2" key={index}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="location"
                    id={`location_${index}`}
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={handleRadioChange}
                    disabled={isDisabled}
                  />
                  <label className="form-check-label" htmlFor={`location_${index}`}>
                    {option.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelect;
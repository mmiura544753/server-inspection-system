// src/components/inspectionItems/forms/DeviceSelect.js
import React from 'react';
import Select from 'react-select';
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
  return (
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
        value={value}
        onChange={onChange}
        placeholder="機器を選択してください"
        noOptionsMessage={() => {
          if (!hasCustomer) return "先に顧客を選択してください";
          return "該当する機器がありません";
        }}
        isSearchable={true}
        isClearable={true}
        isDisabled={isDisabled}
        classNamePrefix="select"
        styles={{
          control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#80bdff' : 
                        (errors && touched) ? '#dc3545' : '#ced4da',
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
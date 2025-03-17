// src/components/inspectionItems/forms/CustomerSelect.js
import React from 'react';
import Select from 'react-select';

const CustomerSelect = ({ 
  customerOptions, 
  value, 
  onChange, 
  errors, 
  touched 
}) => {
  return (
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
        value={value}
        onChange={onChange}
        placeholder="顧客を選択してください"
        noOptionsMessage={() => "該当する顧客がありません"}
        isSearchable={true}
        isClearable={true}
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
    </div>
  );
};

export default CustomerSelect;
// src/components/inspectionItems/forms/LocationSelect.js
import React from 'react';
import Select from 'react-select';

const LocationSelect = ({ 
  locationOptions, 
  value, 
  onChange, 
  isDisabled 
}) => {
  return (
    <div className="mb-3">
      <label htmlFor="location" className="form-label">
        設置ラックNo.
      </label>
      
      <Select
        inputId="location"
        name="location"
        options={locationOptions}
        value={value}
        onChange={onChange}
        placeholder="設置場所を選択してください"
        noOptionsMessage={() => isDisabled ? "先に顧客を選択してください" : "設置場所がありません"}
        isSearchable={true}
        isClearable={true}
        isDisabled={isDisabled}
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
  );
};

export default LocationSelect;
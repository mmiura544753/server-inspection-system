// src/components/inspectionItems/forms/InspectionItemNameInput.js
import React, { useState, useEffect } from 'react';
import { Field, ErrorMessage, useFormikContext } from 'formik';
import Select from 'react-select';
import { inspectionItemAPI } from '../../../services/api';

const InspectionItemNameInput = () => {
  const [itemNameOptions, setItemNameOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState(false);
  const { values, setFieldValue } = useFormikContext();

  // 既存の点検項目名を取得
  useEffect(() => {
    const fetchItemNames = async () => {
      try {
        setLoading(true);
        // 点検項目名マスタから選択肢を取得
        const data = await inspectionItemAPI.getAllItemNames();
        
        // 重複を排除し、ソートする
        const uniqueNames = [...new Set(data.map(item => item.name))].sort();
        
        const options = uniqueNames.map(name => ({
          value: name,
          label: name
        }));
        
        setItemNameOptions(options);
      } catch (err) {
        console.error("点検項目名の取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemNames();
  }, []);

  // カスタム入力ボックスの切り替え
  const handleCustomInputToggle = () => {
    setCustomInput(!customInput);
    if (customInput) {
      setFieldValue('item_name', '');
    }
  };

  return (
    <div className="mb-3">
      <label
        htmlFor="item_name"
        className="form-label required-label"
      >
        点検項目名
      </label>
      
      <div className="d-flex align-items-center mb-2">
        <div className="form-check">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="customInputCheck" 
            checked={customInput}
            onChange={handleCustomInputToggle}
          />
          <label className="form-check-label" htmlFor="customInputCheck">
            カスタム項目名を入力
          </label>
        </div>
      </div>

      {customInput ? (
        <Field
          type="text"
          id="item_name"
          name="item_name"
          className="form-control"
          placeholder="点検項目名を入力"
        />
      ) : (
        <Field
          name="item_name"
        >
          {({ field, meta }) => (
            <Select
              {...field}
              id="item_name"
              options={itemNameOptions}
              isLoading={loading}
              placeholder="点検項目名を選択してください"
              className={meta.touched && meta.error ? "is-invalid" : ""}
              value={itemNameOptions.find(option => option.value === field.value) || null}
              onChange={(selectedOption) => setFieldValue('item_name', selectedOption ? selectedOption.value : '')}
              isDisabled={loading}
              isClearable
              formatCreateLabel={(inputValue) => `「${inputValue}」を新規作成`}
            />
          )}
        </Field>
      )}
      
      <ErrorMessage
        name="item_name"
        component="div"
        className="text-danger"
      />
    </div>
  );
};

export default InspectionItemNameInput;
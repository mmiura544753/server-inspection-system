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
        const data = await inspectionItemAPI.itemNames.getAll();
        
        // オプションとして整形
        const options = data.map(item => ({
          value: item.name,
          label: item.name
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
      setFieldValue('item_names', []);
    } else {
      // 複数選択モードから単一入力モードに切り替える場合、空の文字列配列にする
      setFieldValue('item_names', []);
    }
  };

  // テキストエリアに入力された複数行のテキストを配列に変換する関数
  const handleTextAreaChange = (e) => {
    const text = e.target.value;
    // 空行を除外し、トリムした行の配列を作成
    const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.trim());
    setFieldValue('item_names', lines);
  };

  // 選択された項目を配列として取得する
  const getMultiSelectText = () => {
    if (!values.item_names || !Array.isArray(values.item_names)) {
      return '';
    }
    return values.item_names.join('\n');
  };

  return (
    <div className="mb-3">
      <label
        htmlFor="item_names"
        className="form-label required-label"
      >
        点検項目名（複数選択可能）
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
          as="textarea"
          id="item_names"
          name="item_names"
          className="form-control"
          placeholder="点検項目名を入力（1行に1つずつ入力してください）"
          rows={10}
          onChange={handleTextAreaChange}
          value={getMultiSelectText()}
        />
      ) : (
        <Field
          name="item_names"
        >
          {({ field, meta }) => (
            <Select
              {...field}
              id="item_names"
              options={itemNameOptions}
              isLoading={loading}
              placeholder="点検項目名を選択してください（複数選択可能）"
              className={meta.touched && meta.error ? "is-invalid" : ""}
              value={itemNameOptions.filter(option => 
                values.item_names && Array.isArray(values.item_names) && 
                values.item_names.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                const selectedValues = selectedOptions ? 
                  selectedOptions.map(option => option.value) : [];
                setFieldValue('item_names', selectedValues);
              }}
              isDisabled={loading}
              isMulti
              closeMenuOnSelect={false}
              isClearable
              formatCreateLabel={(inputValue) => `「${inputValue}」を新規作成`}
            />
          )}
        </Field>
      )}
      
      <small className="form-text text-muted">
        複数の点検項目を選択または入力できます。選択した点検項目ごとに新しい点検項目が作成されます。
      </small>
      
      <ErrorMessage
        name="item_names"
        component="div"
        className="text-danger"
      />
    </div>
  );
};

export default InspectionItemNameInput;
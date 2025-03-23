// src/components/inspectionItems/forms/InspectionItemNameInput.js
import React, { useState, useEffect } from 'react';
import { Field, ErrorMessage, useFormikContext } from 'formik';
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

  // チェックボックスの状態変更処理
  const handleCheckboxChange = (itemValue) => {
    let newSelectedItems = [...(values.item_names || [])];
    
    if (newSelectedItems.includes(itemValue)) {
      // すでに選択されている場合は削除
      newSelectedItems = newSelectedItems.filter(value => value !== itemValue);
    } else {
      // 選択されていない場合は追加
      newSelectedItems.push(itemValue);
    }
    
    setFieldValue('item_names', newSelectedItems);
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

  // 全選択/全解除の処理
  const handleSelectAll = (select) => {
    if (select) {
      // 全選択
      const allValues = itemNameOptions.map(option => option.value);
      setFieldValue('item_names', allValues);
    } else {
      // 全解除
      setFieldValue('item_names', []);
    }
  };

  return (
    <div className="mb-3">
      <label
        htmlFor="item_names"
        className="form-label required-label"
      >
        点検項目名（複数選択可能）
      </label>
      
      <div className="d-flex align-items-center mb-2 justify-content-between">
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
        
        {!customInput && (
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleSelectAll(true)}
              disabled={loading}
            >
              全て選択
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleSelectAll(false)}
              disabled={loading}
            >
              全て解除
            </button>
          </div>
        )}
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
        <div className="checkbox-list-container border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">点検項目名を読み込み中...</p>
            </div>
          ) : itemNameOptions.length === 0 ? (
            <div className="alert alert-info">
              点検項目名が登録されていません。カスタム入力でデータを追加してください。
            </div>
          ) : (
            <div className="row">
              {itemNameOptions.map((option, index) => (
                <div className="col-md-6 mb-2" key={index}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`itemCheckbox_${index}`}
                      checked={values.item_names && values.item_names.includes(option.value)}
                      onChange={() => handleCheckboxChange(option.value)}
                    />
                    <label className="form-check-label" htmlFor={`itemCheckbox_${index}`}>
                      {option.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <small className="form-text text-muted mt-2">
        複数の点検項目を選択または入力できます。選択した点検項目ごとに新しい点検項目が作成されます。
        {!customInput && values.item_names && values.item_names.length > 0 && (
          <div className="mt-2">
            <span className="badge bg-primary">{values.item_names.length}個の項目が選択されています</span>
          </div>
        )}
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
// src/components/inspectionItems/forms/InspectionItemNameInput.js
import React, { useState, useEffect } from 'react';
import { Field, ErrorMessage, useFormikContext } from 'formik';
import { inspectionItemAPI } from '../../../services/api';
import { FaCheck } from 'react-icons/fa';

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
        確認作業項目（複数選択可能）
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
            カスタム確認作業項目を入力
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
          placeholder="確認作業項目を入力（1行に1つずつ入力してください）"
          rows={10}
          onChange={handleTextAreaChange}
          value={getMultiSelectText()}
        />
      ) : (
        <div 
          className="border rounded"
          style={{ 
            overflow: 'auto',
            height: `${Math.min(10, itemNameOptions.length) * 3}rem`, // 10行表示、行間隔を広めに
          }}
        >
          {loading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">確認作業項目を読み込み中...</p>
            </div>
          ) : itemNameOptions.length === 0 ? (
            <div className="alert alert-info">
              確認作業項目が登録されていません。カスタム入力でデータを追加してください。
            </div>
          ) : (
            <div className="custom-listbox">
              {itemNameOptions.map((option, index) => {
                const isSelected = values.item_names && values.item_names.includes(option.value);
                return (
                  <div
                    key={index}
                    className={`d-flex align-items-center ${isSelected ? 'bg-light' : ''}`}
                    style={{ 
                      padding: '0.7rem 0.75rem',
                      cursor: 'pointer',
                      borderBottom: index < itemNameOptions.length - 1 ? '1px solid #e9ecef' : 'none'
                    }}
                    onClick={() => handleCheckboxChange(option.value)}
                  >
                    <div 
                      className="me-2 custom-checkbox" 
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#0d6efd' : 'white',
                        color: 'white'
                      }}
                    >
                      {isSelected && <FaCheck size={12} />}
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {option.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      <small className="form-text text-muted mt-2">
        複数の確認作業項目を選択または入力できます。選択した確認作業項目ごとに新しい点検項目が作成されます。
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
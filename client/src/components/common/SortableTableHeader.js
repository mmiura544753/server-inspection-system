// src/components/common/SortableTableHeader.js
import React from 'react';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';

/**
 * ソート可能なテーブルヘッダーコンポーネント
 * 
 * @param {Object} props
 * @param {string} props.field - ソートするフィールド名
 * @param {string} props.label - 表示ラベル
 * @param {string} props.currentSortField - 現在ソート中のフィールド名
 * @param {boolean} props.isDescending - 降順かどうか
 * @param {Function} props.onSort - ソート変更時のコールバック関数
 * @param {string} props.className - 追加のCSSクラス
 */
const SortableTableHeader = ({ 
  field, 
  label, 
  currentSortField, 
  isDescending, 
  onSort,
  className = ''
}) => {
  // このヘッダーが現在ソートされているかどうか
  const isSorted = currentSortField === field;

  // クリック時の処理
  const handleClick = () => {
    if (isSorted) {
      // 同じフィールドがすでにソートされている場合は、昇順/降順を切り替え
      onSort(field, !isDescending);
    } else {
      // 新しいフィールドでソートする場合は、デフォルトで昇順
      onSort(field, false);
    }
  };

  // ソートアイコンの選択
  const renderSortIcon = () => {
    if (!isSorted) {
      return <FaSort className="ms-1 text-gray-400" />;
    }
    return isDescending 
      ? <FaSortDown className="ms-1 text-primary" /> 
      : <FaSortUp className="ms-1 text-primary" />;
  };

  return (
    <th 
      className={`${className} cursor-pointer select-none`}
      onClick={handleClick}
    >
      <div className="d-flex align-items-center">
        {label}
        {renderSortIcon()}
      </div>
    </th>
  );
};

export default SortableTableHeader;
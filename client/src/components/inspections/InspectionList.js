// src/components/inspections/InspectionList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import { formatDate, formatTime } from "../../utils/dateTimeUtils";
import { sortArrayByKey } from "../../utils/sortUtils";

// TailwindCSSスタイルのソートヘッダーコンポーネント
const SortableTailwindHeader = ({ 
  field, 
  label, 
  currentSortField, 
  isDescending, 
  onSort 
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
  const getSortIcon = () => {
    if (!isSorted) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    return isDescending 
      ? <FaSortDown className="ml-1 text-blue-500" /> 
      : <FaSortUp className="ml-1 text-blue-500" />;
  };

  return (
    <th 
      className="py-2 px-4 border-b text-left cursor-pointer select-none"
      onClick={handleClick}
    >
      <div className="flex items-center">
        {label}
        {getSortIcon()}
      </div>
    </th>
  );
};

const InspectionList = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ソート用の状態
  const [sortField, setSortField] = useState("inspection_date");
  const [sortDescending, setSortDescending] = useState(true); // 最新の点検が上に来るようにデフォルトは降順

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionAPI.getAll();
      setInspections(data);
      setError(null);
    } catch (err) {
      console.error("点検一覧取得エラー:", err);
      setError("点検データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // ソートの処理
  const handleSort = (field, descending) => {
    setSortField(field);
    setSortDescending(descending);
  };

  // ソートされたデータ
  const sortedInspections = sortArrayByKey(inspections, sortField, sortDescending);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">点検結果一覧</h1>
        <Link
          to="/inspections/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          新規点検
        </Link>
      </div>

      {error && <Alert type="danger" message={error} />}

      {sortedInspections.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded text-center">
          点検データがありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <SortableTailwindHeader
                  field="inspection_date"
                  label="点検日"
                  currentSortField={sortField}
                  isDescending={sortDescending}
                  onSort={handleSort}
                />
                <SortableTailwindHeader
                  field="inspector_name"
                  label="点検者名"
                  currentSortField={sortField}
                  isDescending={sortDescending}
                  onSort={handleSort}
                />
                <SortableTailwindHeader
                  field="start_time"
                  label="点検時間"
                  currentSortField={sortField}
                  isDescending={sortDescending}
                  onSort={handleSort}
                />
                <SortableTailwindHeader
                  field="device_name"
                  label="機器名"
                  currentSortField={sortField}
                  isDescending={sortDescending}
                  onSort={handleSort}
                />
                <SortableTailwindHeader
                  field="customer_name"
                  label="顧客名"
                  currentSortField={sortField}
                  isDescending={sortDescending}
                  onSort={handleSort}
                />
                <th className="py-2 px-4 border-b text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedInspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    {formatDate(inspection.inspection_date)}
                  </td>
                  <td className="py-2 px-4 border-b">{inspection.inspector_name}</td>
                  <td className="py-2 px-4 border-b">
                    {inspection.start_time && inspection.end_time
                      ? `${formatTime(inspection.start_time)} ~ ${formatTime(
                          inspection.end_time
                        )}`
                      : "時間未記録"}
                  </td>
                  <td className="py-2 px-4 border-b">{inspection.device_name}</td>
                  <td className="py-2 px-4 border-b">{inspection.customer_name}</td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/inspections/${inspection.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                      >
                        詳細
                      </Link>
                      <Link
                        to={`/inspections/edit/${inspection.id}`}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                      >
                        編集
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InspectionList;
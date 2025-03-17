// src/components/inspections/InspectionTable.js
import React from "react";
import InspectionItem from "./InspectionItem";

const InspectionTable = ({ inspectionItems, updateResult }) => {
  // inspectionItemsが未定義または空の配列の場合の表示
  if (!inspectionItems || inspectionItems.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>
            点検項目がありません。データを読み込み中か、APIからデータが返されていない可能性があります。
          </p>
        </div>
      </div>
    );
  }

  // データの構造を確認してログに出力
  console.log("インスペクションテーブルに渡されたデータ:", inspectionItems);

  // APIから返されたデータ構造に合わせた処理
  return (
    <div className="mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left border-b w-24">ラックNo</th>
              <th className="px-4 py-2 text-left border-b w-28">ユニット</th>
              <th className="px-4 py-2 text-left border-b w-40">サーバ名</th>
              <th className="px-4 py-2 text-left border-b w-32">機種</th>
              <th className="px-4 py-2 text-left border-b">点検項目</th>
              <th className="px-4 py-2 text-center border-b w-48">点検結果</th>
            </tr>
          </thead>
          <tbody>
            {inspectionItems.map((location, locationIndex) => (
              <tr key={`location-${locationIndex}`}>
                <td className="px-4 py-2 border-b">
                  {location.rack_number || "-"}
                </td>
                <td className="px-4 py-2 border-b">
                  {location.unit_position || "-"}
                </td>
                <td className="px-4 py-2 border-b">
                  {location.device_name || "-"}
                </td>
                <td className="px-4 py-2 border-b">{location.model || "-"}</td>
                <td className="px-4 py-2 border-b">
                  {location.item_name || "-"}
                </td>
                <td className="px-4 py-2 border-b">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => updateResult(locationIndex, 0, 0, true)}
                      className={`px-4 py-1 rounded-md font-semibold ${
                        location.result === true
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      正常
                    </button>
                    <button
                      onClick={() => updateResult(locationIndex, 0, 0, false)}
                      className={`px-4 py-1 rounded-md font-semibold ${
                        location.result === false
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      異常
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionTable;

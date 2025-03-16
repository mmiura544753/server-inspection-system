// src/components/inspections/InspectionItem.js
import React from "react";

const InspectionItem = ({
  item,
  locationIndex,
  serverIndex,
  itemIndex,
  server,
  updateResult,
  isFirstItem,
  isFirstServer,
  locationName,
  locationRowSpan,
}) => {
  return (
    <tr
      className={
        isFirstItem && isFirstServer ? "border-t-2 border-gray-400" : ""
      }
    >
      {/* 場所 - 最初の項目でのみ表示 */}
      {isFirstItem && isFirstServer ? (
        <td className="px-4 py-2 border-b" rowSpan={locationRowSpan}>
          <div className="font-semibold">{locationName}</div>
        </td>
      ) : null}

      {/* サーバ名 - 各サーバの最初の項目でのみ表示 */}
      {isFirstItem ? (
        <td className="px-4 py-2 border-b" rowSpan={server.items.length}>
          <div className="whitespace-pre-line">{server.id}</div>
        </td>
      ) : null}

      {/* 機種 - 各サーバの最初の項目でのみ表示 */}
      {isFirstItem ? (
        <td className="px-4 py-2 border-b" rowSpan={server.items.length}>
          <div className="whitespace-pre-line">{server.model}</div>
        </td>
      ) : null}

      {/* 点検項目 */}
      <td className="px-4 py-2 border-b">
        <div className="text-sm">{item}</div>
      </td>

      {/* 点検結果 */}
      <td className="px-4 py-2 border-b">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() =>
              updateResult(locationIndex, serverIndex, itemIndex, true)
            }
            className={`px-4 py-1 rounded-md font-semibold ${
              server.results[itemIndex] === true
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            正常
          </button>
          <button
            onClick={() =>
              updateResult(locationIndex, serverIndex, itemIndex, false)
            }
            className={`px-4 py-1 rounded-md font-semibold ${
              server.results[itemIndex] === false
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            異常
          </button>
        </div>
      </td>
    </tr>
  );
};

export default InspectionItem;

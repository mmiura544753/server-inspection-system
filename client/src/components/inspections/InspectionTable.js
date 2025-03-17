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
            {inspectionItems.map((location, locationIndex) => {
              // 各ロケーションの合計行数を計算
              // servers配列がない場合は0を返す
              const locationRowSpan = location.servers
                ? location.servers.reduce(
                    (acc, srv) => acc + (srv.items ? srv.items.length : 0),
                    0
                  )
                : 0;

              // serversがなければ空の配列としてマップ処理
              return (location.servers || []).map((server, serverIndex) =>
                // itemsがなければ空の配列としてマップ処理
                (server.items || []).map((item, itemIndex) => (
                  <InspectionItem
                    key={`${locationIndex}-${serverIndex}-${itemIndex}`}
                    item={item}
                    locationIndex={locationIndex}
                    serverIndex={serverIndex}
                    itemIndex={itemIndex}
                    server={server}
                    updateResult={updateResult}
                    isFirstItem={itemIndex === 0}
                    isFirstServer={serverIndex === 0}
                    locationName={location.locationName}
                    locationRowSpan={locationRowSpan}
                  />
                ))
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionTable;

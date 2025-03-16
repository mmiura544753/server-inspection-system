// src/components/inspections/InspectionTable.js
import React from "react";
import InspectionItem from "./InspectionItem";

const InspectionTable = ({ inspectionItems, updateResult }) => {
  return (
    <div className="mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left border-b w-24">場所</th>
              <th className="px-4 py-2 text-left border-b w-40">サーバ名</th>
              <th className="px-4 py-2 text-left border-b w-32">機種</th>
              <th className="px-4 py-2 text-left border-b">点検項目</th>
              <th className="px-4 py-2 text-center border-b w-48">点検結果</th>
            </tr>
          </thead>
          <tbody>
            {inspectionItems.map((location, locationIndex) => {
              // 各ロケーションの合計行数を計算
              const locationRowSpan = location.servers.reduce(
                (acc, srv) => acc + srv.items.length,
                0
              );
              
              return location.servers.map((server, serverIndex) =>
                server.items.map((item, itemIndex) => (
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

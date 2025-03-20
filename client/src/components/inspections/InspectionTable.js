// src/components/inspections/InspectionTable.js
import React from "react";

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
            {inspectionItems.map((location, locationIndex) => {
              // 各ロケーションごとにserversが存在するか確認
              if (location.servers && Array.isArray(location.servers)) {
                // 通常の階層化されたデータ構造の場合
                return location.servers.flatMap((server, serverIndex) => {
                  return server.items.map((item, itemIndex) => (
                    <tr key={`${locationIndex}-${serverIndex}-${itemIndex}`}>
                      {/* 最初の項目でのみロケーション名と「全て正常」ボタンを表示 */}
                      {serverIndex === 0 && itemIndex === 0 ? (
                        <td
                          className="px-4 py-2 border-b"
                          rowSpan={location.servers.reduce(
                            (acc, srv) => acc + srv.items.length,
                            0
                          )}
                        >
                          <div className="flex flex-col space-y-2">
                            <span>{location.locationName || "-"}</span>
                            <button
                              onClick={() => {
                                // このラックの全サーバーの全項目を正常に設定
                                location.servers.forEach((srv, srvIdx) => {
                                  srv.items.forEach((_, itmIdx) => {
                                    updateResult(locationIndex, srvIdx, itmIdx, true);
                                  });
                                });
                              }}
                              className="bg-green-100 hover:bg-green-200 text-green-800 text-xs py-1 px-2 rounded"
                            >
                              全て正常
                            </button>
                          </div>
                        </td>
                      ) : null}
                      {/* 各サーバーの最初の項目でのみユニット位置を表示 */}
                      {itemIndex === 0 ? (
                        <td
                          className="px-4 py-2 border-b"
                          rowSpan={server.items.length}
                        >
                          {server.unit_position || "-"}
                        </td>
                      ) : null}
                      {/* 各サーバーの最初の項目でのみサーバー名を表示 */}
                      {itemIndex === 0 ? (
                        <td
                          className="px-4 py-2 border-b"
                          rowSpan={server.items.length}
                        >
                          {server.id || "-"}
                        </td>
                      ) : null}
                      {/* 各サーバーの最初の項目でのみ機種を表示 */}
                      {itemIndex === 0 ? (
                        <td
                          className="px-4 py-2 border-b"
                          rowSpan={server.items.length}
                        >
                          {server.model || "-"}
                        </td>
                      ) : null}
                      {/* 点検項目 */}
                      <td className="px-4 py-2 border-b">{item || "-"}</td>
                      {/* 点検結果 */}
                      <td className="px-4 py-2 border-b">
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() =>
                              updateResult(
                                locationIndex,
                                serverIndex,
                                itemIndex,
                                true
                              )
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
                              updateResult(
                                locationIndex,
                                serverIndex,
                                itemIndex,
                                false
                              )
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
                  ));
                });
              } else {
                // フラットなデータ構造の場合（serversがない場合）
                return (
                  <tr key={`location-${locationIndex}`}>
                    <td className="px-4 py-2 border-b">
                      <div className="flex flex-col space-y-2">
                        <span>{location.locationName || location.rack_number || "-"}</span>
                        <button
                          onClick={() => {
                            // フラットな構造用の全正常設定
                            location.result = true;
                            updateResult(locationIndex, 0, 0, true);
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-800 text-xs py-1 px-2 rounded"
                        >
                          全て正常
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b">
                      {location.unit_position || "-"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {location.device_name || location.id || "-"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {location.model || "-"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {location.item_name || "-"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            // フラットな構造用の単純な更新関数の呼び出し
                            location.result = true;
                            // この行により再レンダリングを強制
                            updateResult(locationIndex, 0, 0, true);
                          }}
                          className={`px-4 py-1 rounded-md font-semibold ${
                            location.result === true
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          正常
                        </button>
                        <button
                          onClick={() => {
                            // フラットな構造用の単純な更新関数の呼び出し
                            location.result = false;
                            // この行により再レンダリングを強制
                            updateResult(locationIndex, 0, 0, false);
                          }}
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
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionTable;

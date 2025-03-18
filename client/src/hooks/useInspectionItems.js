// src/hooks/useInspectionItems.js
import { useState, useEffect } from "react";

export const useInspectionItems = (setIsStarted, setIsComplete) => {
  const [inspectionItems, setInspectionItems] = useState([]);

  // 点検結果を更新する関数
  const updateResult = (locationIndex, serverIndex, itemIndex, isNormal) => {
    const newInspectionItems = [...inspectionItems];

    // データ構造に応じた処理
    const location = newInspectionItems[locationIndex];
    if (!location) return; // 存在チェック

    // 階層化されたデータ構造（servers配列が存在する場合）
    if (location.servers && Array.isArray(location.servers)) {
      const server = location.servers[serverIndex];
      if (!server) return; // 存在チェック

      // results配列が存在する場合
      if (server.results && Array.isArray(server.results)) {
        server.results[itemIndex] = isNormal;
      } else {
        // results配列が存在しない場合は作成
        server.results = Array(server.items.length).fill(null);
        server.results[itemIndex] = isNormal;
      }
    } else {
      // フラットな構造の場合、直接resultプロパティを更新
      location.result = isNormal;
    }

    setInspectionItems(newInspectionItems);
  };

  // 点検完了率を計算する関数
  const calculateCompletionRate = () => {
    // inspectionItemsが未定義または空の場合は0を返す
    if (!inspectionItems || !inspectionItems.length) {
      return 0;
    }

    let total = 0;
    let completed = 0;

    inspectionItems.forEach((location) => {
      // 階層化された構造（servers配列が存在する場合）
      if (location.servers && Array.isArray(location.servers)) {
        location.servers.forEach((server) => {
          if (server.results && Array.isArray(server.results)) {
            server.results.forEach((result) => {
              total++;
              if (result !== null) completed++;
            });
          }
        });
      } else {
        // フラットな構造の場合
        total++;
        if (location.result !== null && location.result !== undefined) {
          completed++;
        }
      }
    });

    return total > 0 ? Math.floor((completed / total) * 100) : 0;
  };

  // 任意の点検結果が入力されているかチェック
  const hasAnyResults = () => {
    if (!inspectionItems || !inspectionItems.length) {
      return false;
    }

    return inspectionItems.some(
      (location) =>
        location.servers &&
        location.servers.some(
          (server) =>
            server.results && server.results.some((result) => result !== null)
        )
    );
  };

  // すべての点検項目がチェックされているかチェック
  const allItemsChecked = () => {
    if (!inspectionItems || !inspectionItems.length) {
      return false;
    }

    return inspectionItems.every(
      (location) =>
        location.servers &&
        location.servers.every(
          (server) =>
            server.results && server.results.every((result) => result !== null)
        )
    );
  };

  // チェック状態が変更されたときに点検状態を更新
  useEffect(() => {
    if (!setIsStarted || !setIsComplete) return;

    if (hasAnyResults()) {
      setIsStarted(true);
    }

    if (allItemsChecked()) {
      setIsComplete(true);
    }
  }, [inspectionItems, setIsStarted, setIsComplete]);

  return {
    inspectionItems,
    setInspectionItems,
    updateResult,
    calculateCompletionRate,
    hasAnyResults,
    allItemsChecked,
  };
};

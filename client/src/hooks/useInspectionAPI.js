// src/hooks/useInspectionAPI.js
import { useState } from "react";
import { inspectionAPI } from "../services/api";
import { formatDateForAPI } from "../utils/dateTimeUtils";

export const useInspectionAPI = (
  inspectionItems,
  setInspectionItems,
  setCustomerName,
  date,
  startTime,
  endTime,
  setSaveStatus,
  setError
) => {
  const [loading, setLoading] = useState(true);

  // APIから点検項目を取得する関数
  const fetchInspectionItems = async () => {
    try {
      setLoading(true);

      // APIからデータを取得
      const response = await inspectionAPI.getInspectionItems();

      // APIのレスポンス形式に合わせて調整
      const inspectionData = response.data?.data || [];
      console.log("APIから受け取ったデータ:", inspectionData);

      if (inspectionData.length > 0) {
        // 顧客名を設定 - 最初の項目から取得
        setCustomerName(inspectionData[0].customer_name || "サーバー点検");
        setInspectionItems(inspectionData);
      } else {
        // データがない場合は空配列を設定
        setInspectionItems([]);
      }

      setError(null);
    } catch (err) {
      console.error("点検項目データ取得エラー:", err);
      setError("点検データの読み込みに失敗しました。");
      // エラー時には空の配列を設定して、他の関数がエラーにならないようにする
      setInspectionItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 前回の点検データを読み込む関数
  const loadPreviousData = async () => {
    try {
      setLoading(true);

      // デモ用のダミーデータ
      const previousData = {
        date: { year: "2025", month: "03", day: "01" },
        startTime: "09:00",
        endTime: "10:30",
        results: {
          // ラックNo.6のOBSVSRV11の1つ目の項目を正常に
          "0-0-0": true,
          // ラックNo.6のOBSVSRV12の1つ目の項目を異常に
          "0-1-0": false,
        },
      };

      // 点検結果を設定
      const newInspectionItems = [...inspectionItems];

      // 各結果をマッピング
      Object.entries(previousData.results).forEach(([key, value]) => {
        const [locIdx, srvIdx, itemIdx] = key.split("-").map(Number);
        if (
          newInspectionItems[locIdx]?.servers[srvIdx]?.results[itemIdx] !==
          undefined
        ) {
          newInspectionItems[locIdx].servers[srvIdx].results[itemIdx] = value;
        }
      });

      setInspectionItems(newInspectionItems);
      setLoading(false);
    } catch (error) {
      console.error("前回データ読み込みエラー:", error);
      setError("前回の点検データの読み込みに失敗しました。");
      setLoading(false);
    }
  };

  // 点検結果を保存する関数
  const saveInspectionResults = async (navigate) => {
    try {
      setSaveStatus("saving");

      // 日付のフォーマット（YYYY-MM-DD形式）
      const formattedDate = formatDateForAPI(date);

      // 保存用のデータを構築
      const resultsData = {
        inspection_date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        inspector_name: "システム管理者", // 実際のアプリケーションでは入力フィールドから取得
        device_id: inspectionItems[0]?.servers[0]?.device_id || 1, // 最初の機器のIDを使用
        status: "完了", // ステータスを追加
        results: [],
      };

      // 各点検項目の結果を追加
      inspectionItems.forEach((location) => {
        if (location.servers && Array.isArray(location.servers)) {
          location.servers.forEach((server) => {
            if (server.items && Array.isArray(server.items)) {
              server.items.forEach((item, index) => {
                if (server.results && server.results[index] !== null) {
                  // 点検項目IDを取得する
                  let itemId;

                  // アイテムの構造に応じてIDを抽出
                  if (typeof item === "object" && item.id) {
                    itemId = item.id;
                  } else if (server.item_ids && server.item_ids[index]) {
                    itemId = server.item_ids[index];
                  } else {
                    // デバッグのためにIDが見つからない場合のログ
                    console.warn(`点検項目IDが見つかりません:`, {
                      item,
                      index,
                      server,
                    });
                    itemId = index + 1; // 応急措置としてインデックス+1をIDとして使用
                  }

                  resultsData.results.push({
                    inspection_item_id: itemId,
                    status: server.results[index] ? "正常" : "異常",
                  });
                }
              });
            }
          });
        }
      });

      console.log("保存するデータ:", resultsData);

      // APIで保存
      await inspectionAPI.create(resultsData);

      // 成功したら状態を更新
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("");
        // 保存が完了したら点検一覧ページに戻る
        if (navigate) navigate("/inspections");
      }, 2000);
    } catch (error) {
      console.error("保存エラー:", error);
      setSaveStatus("error");
      setError("点検結果の保存に失敗しました: " + (error.message || ""));
    }
  };

  return {
    loading,
    fetchInspectionItems,
    loadPreviousData,
    saveInspectionResults,
  };
};

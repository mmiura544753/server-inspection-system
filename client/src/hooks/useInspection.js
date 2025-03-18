// src/hooks/useInspection.js
import { useState, useEffect } from "react";
import { inspectionAPI } from "../services/api";

export const useInspection = () => {
  // 現在の日時を取得する
  const today = new Date();

  // 状態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(today); // 日付をDate型で保持
  const [startTime, setStartTime] = useState(""); // 空文字列で初期化
  const [endTime, setEndTime] = useState(""); // 空文字列で初期化
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("データセンターIT ホストサーバ室");
  const [workContent, setWorkContent] =
    useState("ハードウェアLEDランプの目視確認");
  const [inspectionItems, setInspectionItems] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");

  // ページ読み込み時に現在時刻を開始時間に設定
  useEffect(() => {
    const currentTime = formatTime(new Date());
    setStartTime(currentTime);
  }, []);

  // 時間フォーマット関数
  const formatTime = (date) => {
    return date.toTimeString().substring(0, 5);
  };

  // データの読み込み
  useEffect(() => {
    fetchInspectionItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 開始時間の設定
  useEffect(() => {
    if (isStarted && !startTime) {
      const now = new Date();
      setStartTime(formatTime(now));
    }
  }, [isStarted, startTime]);

  // 完了時間の設定
  useEffect(() => {
    if (isComplete && !endTime) {
      const now = new Date();
      setEndTime(formatTime(now));
    }
  }, [isComplete, endTime]);

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
    if (!isStarted && hasAnyResults()) {
      setIsStarted(true);
    }

    if (!isComplete && allItemsChecked()) {
      setIsComplete(true);
    }
  }, [inspectionItems, isStarted, isComplete, hasAnyResults, allItemsChecked]);

  // 点検結果を更新する関数
  // updateResult関数の修正例
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

  // 点検完了率を計算
  // 点検完了率を計算する関数（修正版）
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

  // 前回の点検データを読み込む関数
  const loadPreviousData = async () => {
    try {
      setLoading(true);

      // 前回の点検データを取得（実際のアプリケーションではこのAPI関数を実装）
      // const previousData = await inspectionAPI.getLatestInspection();

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

      // 点検日と時間を設定
      setDate(previousData.date);
      setStartTime(previousData.startTime);
      setEndTime(previousData.endTime);

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
      let formattedDate;
      if (date instanceof Date) {
        // Date型の場合
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } else {
        // 既存の形式の場合（オブジェクトの場合）
        formattedDate = `${date.year}-${date.month}-${date.day}`;
      }

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

      // APIで保存（コメントアウトを解除）
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
    error,
    setError,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isStarted,
    isComplete,
    customerName,
    location,
    setLocation,
    workContent,
    setWorkContent,
    inspectionItems,
    saveStatus,
    updateResult,
    calculateCompletionRate,
    loadPreviousData,
    saveInspectionResults,
    formatTime,
  };
};

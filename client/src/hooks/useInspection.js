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

  // 設置場所ごとにアイテムをグループ化する関数
  const groupItemsByLocation = (items) => {
    // 設置場所ごとにグループ化するためのオブジェクト
    const locationGroups = {};

    // まず設置場所でグループ化
    items.forEach((item) => {
      const locationKey = item.location || "未設定";

      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = {
          locationId: `loc_${locationKey}`,
          locationName: locationKey,
          servers: {},
        };
      }

      // 次に各設置場所内で機器ごとにグループ化
      const deviceKey = item.device_id;
      if (!locationGroups[locationKey].servers[deviceKey]) {
        locationGroups[locationKey].servers[deviceKey] = {
          id: item.device_name,
          device_id: item.device_id,
          type: item.device_type,
          items: [],
          results: [],
        };
      }

      // 点検項目を追加
      locationGroups[locationKey].servers[deviceKey].items.push(item.item_name);
      locationGroups[locationKey].servers[deviceKey].results.push(null); // 初期値はnull
    });

    // 最終的なデータ構造に変換（配列形式に）
    return Object.values(locationGroups).map((location) => {
      return {
        ...location,
        servers: Object.values(location.servers),
      };
    });
  };

  // APIから点検項目を取得する関数
  const fetchInspectionItems = async () => {
    try {
      setLoading(true);

      // APIからデータを取得
      const response = await inspectionAPI.getInspectionItems();
      // APIのレスポンス形式に合わせて調整
      const items = response.data?.data || [];

      // 顧客名を取得（最初のアイテムから）
      if (items.length > 0) {
        setCustomerName(items[0].customer_name);
      }

      // データを設置場所ごとにグループ化
      const groupedByLocation = groupItemsByLocation(items);
      setInspectionItems(groupedByLocation);

      setError(null);
    } catch (err) {
      console.error("点検項目データ取得エラー:", err);
      setError("点検データの読み込みに失敗しました。");
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
    return inspectionItems.some((location) =>
      location.servers.some((server) =>
        server.results.some((result) => result !== null)
      )
    );
  };

  // すべての点検項目がチェックされているかチェック
  const allItemsChecked = () => {
    return inspectionItems.every((location) =>
      location.servers.every((server) =>
        server.results.every((result) => result !== null)
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
  }, [inspectionItems, isStarted, isComplete]);

  // 点検結果を更新する関数
  const updateResult = (locationIndex, serverIndex, itemIndex, isNormal) => {
    const newInspectionItems = [...inspectionItems];
    newInspectionItems[locationIndex].servers[serverIndex].results[itemIndex] =
      isNormal;
    setInspectionItems(newInspectionItems);
  };

  // 点検完了率を計算
  const calculateCompletionRate = () => {
    let total = 0;
    let completed = 0;

    inspectionItems.forEach((location) => {
      location.servers.forEach((server) => {
        server.results.forEach((result) => {
          total++;
          if (result !== null) completed++;
        });
      });
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

  // 点検結果を保存する関数を作成
  const saveInspectionResults = async (navigate) => {
    try {
      setSaveStatus("saving");

      // 保存用のデータを構築
      const resultsData = {
        inspection_date: `${date.year}-${date.month}-${date.day}`,
        start_time: startTime,
        end_time: endTime,
        inspector_name: "システム管理者", // 実際のアプリケーションでは入力フィールドから取得
        device_id: inspectionItems[0]?.servers[0]?.device_id || 1, // 最初の機器のIDを使用
        results: [],
      };

      // 各点検項目の結果を追加
      inspectionItems.forEach((location) => {
        location.servers.forEach((server) => {
          server.items.forEach((item, index) => {
            if (server.results[index] !== null) {
              resultsData.results.push({
                inspection_item_id: item.id || 1, // 実際のアプリケーションではitem.idを使用
                status: server.results[index] ? "正常" : "異常",
              });
            }
          });
        });
      });

      // APIで保存（実際のアプリケーションではこのAPI関数を実装）
      // await inspectionAPI.saveResults(resultsData);

      console.log("保存するデータ:", resultsData);

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
      setError("点検結果の保存に失敗しました。");
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

// src/hooks/useInspection.js
import { useState, useEffect } from "react";
import { useInspectionBasicState } from "./useInspectionBasicState";
import { useInspectionItems } from "./useInspectionItems";
import { useInspectionAPI } from "./useInspectionAPI";
import { formatTime } from "../utils/dateTimeUtils";

export const useInspection = () => {
  const [error, setError] = useState(null);

  // 基本状態の管理
  const basicState = useInspectionBasicState();

  // 点検項目の管理
  const itemsState = useInspectionItems(
    basicState.setIsStarted,
    basicState.setIsComplete
  );

  // API通信
  const apiState = useInspectionAPI(
    itemsState.inspectionItems,
    itemsState.setInspectionItems,
    basicState.setCustomerName,
    basicState.date,
    basicState.startTime,
    basicState.endTime,
    basicState.setSaveStatus,
    setError
  );

  // コンポーネントマウント時にデータを読み込む
  useEffect(() => {
    apiState.fetchInspectionItems();
  }, [apiState]);

  // 統合されたフックの返り値
  return {
    // エラー状態
    error,
    setError,

    // 基本状態
    ...basicState,

    // 点検項目の状態と操作
    inspectionItems: itemsState.inspectionItems,
    updateResult: itemsState.updateResult,
    calculateCompletionRate: itemsState.calculateCompletionRate,

    // API操作
    loading: apiState.loading,
    loadPreviousData: apiState.loadPreviousData,
    saveInspectionResults: apiState.saveInspectionResults,

    // ユーティリティ
    formatTime,
  };
};

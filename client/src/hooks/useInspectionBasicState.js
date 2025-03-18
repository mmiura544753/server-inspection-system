// src/hooks/useInspectionBasicState.js
import { useState, useEffect } from "react";
import { formatTime } from "../utils/dateTimeUtils";

export const useInspectionBasicState = () => {
  const today = new Date();

  // 基本的な状態管理
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("データセンターIT ホストサーバ室");
  const [workContent, setWorkContent] =
    useState("ハードウェアLEDランプの目視確認");
  const [saveStatus, setSaveStatus] = useState("");

  // ページ読み込み時に現在時刻を開始時間に設定
  useEffect(() => {
    const currentTime = formatTime(new Date());
    setStartTime(currentTime);
  }, []);

  // 開始時間の自動設定
  useEffect(() => {
    if (isStarted && !startTime) {
      const now = new Date();
      setStartTime(formatTime(now));
    }
  }, [isStarted, startTime]);

  // 完了時間の自動設定
  useEffect(() => {
    if (isComplete && !endTime) {
      const now = new Date();
      setEndTime(formatTime(now));
    }
  }, [isComplete, endTime]);

  return {
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isStarted,
    setIsStarted,
    isComplete,
    setIsComplete,
    customerName,
    setCustomerName,
    location,
    setLocation,
    workContent,
    setWorkContent,
    saveStatus,
    setSaveStatus,
  };
};

// src/components/inspections/InspectionForm.jsx の修正部分

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaClock, Save, RotateCcw, CheckCircle } from "lucide-react";
import {
  inspectionAPI,
  deviceAPI,
  customerAPI,
  inspectionItemAPI,
} from "../../services/api";

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // 状態変数
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");

  // 初期データの読み込み
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // 顧客一覧の取得
        const customersData = await customerAPI.getAll();
        setCustomers(customersData);

        // 編集モードの場合は既存データの取得
        if (isEditMode && id) {
          const inspectionData = await inspectionAPI.getById(id);

          setInspectionDate(inspectionData.inspection_date);
          setStartTime(inspectionData.start_time || "");
          setEndTime(inspectionData.end_time || "");
          setInspectorName(inspectionData.inspector_name || "");

          if (inspectionData.customer_id) {
            setSelectedCustomerId(inspectionData.customer_id);
            await fetchInspectionItemsByCustomer(
              inspectionData.customer_id,
              inspectionData
            );
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("初期データ取得エラー:", err);
        setError("データの読み込みに失敗しました。");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode]);

  // 顧客選択時の処理
  useEffect(() => {
    if (selectedCustomerId) {
      fetchInspectionItemsByCustomer(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // 顧客ごとの点検項目を取得
  const fetchInspectionItemsByCustomer = async (
    customerId,
    existingData = null
  ) => {
    try {
      setLoading(true);

      // 顧客に紐づく機器を取得
      const devices = await deviceAPI.getByCustomerId(customerId);

      // 各機器の点検項目を取得
      const allItems = [];

      for (const device of devices) {
        const items = await inspectionItemAPI.getByDeviceId(device.id);

        if (items && items.length > 0) {
          // 各点検項目に機器情報を付加
          const itemsWithDevice = items.map((item) => ({
            ...item,
            device_name: device.device_name,
            device_id: device.id,
            location: device.location || "未設定",
            result: null, // 初期値はnull
          }));

          allItems.push(...itemsWithDevice);
        }
      }

      // 設置場所でソート
      allItems.sort((a, b) => {
        if (a.location < b.location) return -1;
        if (a.location > b.location) return 1;
        return 0;
      });

      // 編集モードの場合、既存の結果をマッピング
      if (isEditMode && existingData && existingData.results) {
        existingData.results.forEach((result) => {
          const matchingItem = allItems.find(
            (item) => item.id === result.inspection_item_id
          );
          if (matchingItem) {
            matchingItem.result = result.status === "正常";
          }
        });
      }

      setInspectionItems(allItems);
      setLoading(false);
    } catch (err) {
      console.error("点検項目取得エラー:", err);
      setError("点検項目の読み込みに失敗しました。");
      setLoading(false);
    }
  };

  // 点検結果を更新する関数
  const updateResult = (itemIndex, isNormal) => {
    const newInspectionItems = [...inspectionItems];
    newInspectionItems[itemIndex].result = isNormal;
    setInspectionItems(newInspectionItems);
  };

  // 点検完了率を計算
  const calculateCompletionRate = () => {
    if (inspectionItems.length === 0) return 0;

    const completed = inspectionItems.filter(
      (item) => item.result !== null
    ).length;
    return Math.floor((completed / inspectionItems.length) * 100);
  };

  // 点検結果の保存
  const saveInspectionResults = async () => {
    if (!selectedCustomerId || !inspectionDate || !inspectorName) {
      setError("顧客、点検日、点検者名は必須項目です。");
      return;
    }

    try {
      setSaveStatus("saving");

      // 保存用のデータを作成
      const resultsData = {
        inspection_date: inspectionDate,
        start_time: startTime,
        end_time: endTime,
        inspector_name: inspectorName,
        device_id: inspectionItems[0]?.device_id, // 最初の機器IDを使用（改善可能）
        results: [],
      };

      // 各点検項目の結果を追加
      inspectionItems.forEach((item) => {
        if (item.result !== null) {
          resultsData.results.push({
            inspection_item_id: item.id,
            status: item.result ? "正常" : "異常",
          });
        }
      });

      if (isEditMode) {
        // 更新の場合
        await inspectionAPI.update(id, resultsData);
      } else {
        // 新規作成の場合
        await inspectionAPI.create(resultsData);
      }

      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("");
        navigate("/inspections"); // 保存後に一覧画面に戻る
      }, 2000);
    } catch (err) {
      console.error("保存エラー:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // 前回の点検データを読み込む
  const loadPreviousInspection = async () => {
    if (!selectedCustomerId) {
      setError("顧客を選択してください。");
      return;
    }

    try {
      setLoading(true);

      // 選択された顧客の最新の点検を取得
      const devices = await deviceAPI.getByCustomerId(selectedCustomerId);
      if (devices.length === 0) {
        setError("この顧客の機器データがありません。");
        setLoading(false);
        return;
      }

      // 最初の機器の最新点検を取得（実際にはもっと複雑なロジックが必要かも）
      const latestInspection = await inspectionAPI.getLatestByDevice(
        devices[0].id
      );

      if (latestInspection) {
        setInspectionDate(latestInspection.inspection_date);
        setStartTime(latestInspection.start_time || "");
        setEndTime(latestInspection.end_time || "");
        setInspectorName(latestInspection.inspector_name || "");

        // 点検結果を現在の項目に適用
        const newItems = [...inspectionItems];
        latestInspection.results.forEach((result) => {
          const index = newItems.findIndex(
            (item) => item.id === result.inspection_item_id
          );
          if (index !== -1) {
            newItems[index].result = result.status === "正常";
          }
        });

        setInspectionItems(newItems);
      } else {
        setError("前回の点検データが見つかりませんでした。");
      }

      setLoading(false);
    } catch (err) {
      console.error("前回データ取得エラー:", err);
      setError("前回の点検データを取得できませんでした。");
      setLoading(false);
    }
  };

  // 設置場所ごとにグループ化する関数
  const groupByLocation = () => {
    const groups = {};

    inspectionItems.forEach((item) => {
      const key = item.location || "未設定";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // オブジェクトを配列に変換
    return Object.entries(groups).map(([location, items]) => ({
      location,
      items,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-semibold">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 設置場所でグループ化したデータ
  const groupedItems = groupByLocation();

  return (
    <div className="mx-auto bg-white p-6 rounded-lg shadow-lg max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">
          サーバー点検チェックシート
        </h1>
        <div className="bg-indigo-100 py-2 px-4 rounded-lg flex items-center mt-4 md:mt-0">
          <span className="font-semibold mr-2">点検実施状況:</span>
          <span className="text-indigo-700">
            {calculateCompletionRate()}% 完了
          </span>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center mb-4">
          <div className="w-full md:w-1/2 lg:w-1/3 mb-4 md:mb-0">
            <label className="block text-gray-700 font-semibold mb-2">
              顧客:
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={isEditMode}
            >
              <option value="">顧客を選択してください</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap">
          <div className="w-full md:w-1/4 mb-4 md:mb-0 md:pr-2">
            <label className="block text-gray-700 font-semibold mb-2">
              点検日:
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="w-full md:w-1/4 mb-4 md:mb-0 md:px-2">
            <label className="block text-gray-700 font-semibold mb-2">
              開始時間:
            </label>
            <div className="flex items-center">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <Clock className="ml-2 text-gray-500" size={16} />
            </div>
          </div>

          <div className="w-full md:w-1/4 mb-4 md:mb-0 md:px-2">
            <label className="block text-gray-700 font-semibold mb-2">
              終了時間:
            </label>
            <div className="flex items-center">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <Clock className="ml-2 text-gray-500" size={16} />
            </div>
          </div>

          <div className="w-full md:w-1/4 md:pl-2">
            <label className="block text-gray-700 font-semibold mb-2">
              点検者:
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="点検者名を入力"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      {selectedCustomerId ? (
        <>
          {groupedItems.length > 0 ? (
            <div className="mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left border-b">設置場所</th>
                      <th className="px-4 py-2 text-left border-b">機器名</th>
                      <th className="px-4 py-2 text-left border-b">点検項目</th>
                      <th className="px-4 py-2 text-center border-b w-48">
                        点検結果
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedItems.map((group, groupIndex) =>
                      group.items.map((item, itemIndex) => (
                        <tr
                          key={`${groupIndex}-${itemIndex}`}
                          className={
                            itemIndex === 0 ? "border-t-2 border-gray-400" : ""
                          }
                        >
                          {/* 設置場所 - グループの最初の項目でのみ表示 */}
                          {itemIndex === 0 ? (
                            <td
                              className="px-4 py-2 border-b"
                              rowSpan={group.items.length}
                            >
                              <div className="font-semibold">
                                {group.location}
                              </div>
                            </td>
                          ) : null}

                          <td className="px-4 py-2 border-b">
                            <div className="whitespace-pre-line">
                              {item.device_name}
                            </div>
                          </td>

                          <td className="px-4 py-2 border-b">
                            <div className="text-sm">{item.item_name}</div>
                          </td>

                          <td className="px-4 py-2 border-b">
                            <div className="flex justify-center space-x-4">
                              <button
                                onClick={() =>
                                  updateResult(
                                    inspectionItems.findIndex(
                                      (i) => i.id === item.id
                                    ),
                                    true
                                  )
                                }
                                className={`px-4 py-1 rounded-md font-semibold ${
                                  item.result === true
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                正常
                              </button>
                              <button
                                onClick={() =>
                                  updateResult(
                                    inspectionItems.findIndex(
                                      (i) => i.id === item.id
                                    ),
                                    false
                                  )
                                }
                                className={`px-4 py-1 rounded-md font-semibold ${
                                  item.result === false
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                異常
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
              <p>
                選択された顧客の点検項目がありません。点検項目マスタで登録してください。
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 flex items-center"
              onClick={loadPreviousInspection}
            >
              <RotateCcw className="mr-2" size={18} />
              前回の点検データを表示
            </button>

            <div className="flex items-center">
              {saveStatus === "success" && (
                <div className="mr-4 text-green-600 flex items-center">
                  <CheckCircle className="mr-1" size={20} />
                  保存しました
                </div>
              )}

              {saveStatus === "error" && (
                <div className="mr-4 text-red-600">保存に失敗しました</div>
              )}

              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveInspectionResults}
                disabled={
                  !selectedCustomerId ||
                  inspectionItems.length === 0 ||
                  saveStatus === "saving"
                }
              >
                {saveStatus === "saving" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    点検結果を保存
                  </>
                )}
              </button>

              <Link
                to="/inspections"
                className="ml-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow hover:bg-gray-400"
              >
                キャンセル
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
          <p>顧客を選択すると、点検項目が表示されます。</p>
        </div>
      )}
    </div>
  );
};

export default InspectionForm;

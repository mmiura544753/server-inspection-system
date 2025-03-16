// src/components/inspections/ServerInspectionSheet.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Save, RotateCcw } from 'lucide-react';
import { inspectionAPI, deviceAPI, customerAPI, inspectionItemAPI } from '../../services/api';
import Loading from '../common/Loading';
import Alert from '../common/Alert';

const ServerInspectionSheet = () => {
  const navigate = useNavigate();
  
  // 現在の日時を取得する
  const today = new Date();
  const formattedDate = {
    year: today.getFullYear(),
    month: (today.getMonth() + 1).toString().padStart(2, '0'),
    day: today.getDate().toString().padStart(2, '0')
  };
  
  // 状態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(formattedDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('データセンターIT ホストサーバ室');
  const [workContent, setWorkContent] = useState('ハードウェアLEDランプの目視確認');
  const [inspectionItems, setInspectionItems] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  
  // データの読み込み
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        
        // SQLクエリの結果に近いデータ構造を取得
        // 実際のアプリケーションでは、以下のAPIエンドポイントを作成します
        const response = await inspectionAPI.getInspectionItems();
        const items = response.data || [];
        
        // 顧客名を取得（最初のアイテムから）
        if (items.length > 0) {
          setCustomerName(items[0].customer_name);
        }
        
        // データを設置場所ごとにグループ化
        // 実際のデータには設置場所（ラック）情報がないので、仮のラック番号を割り当てる
        const groupedByLocation = groupItemsByLocation(items);
        setInspectionItems(groupedByLocation);
        
        setError(null);
      } catch (err) {
        console.error('点検項目データ取得エラー:', err);
        setError('点検データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInspectionItems();
  }, []);

  // デモ用：アイテムをラックごとにグループ化する関数
  const groupItemsByLocation = (items) => {
    // 実際のデータには設置場所情報がないため、仮のラック番号を割り当てる
    const deviceGroups = {};
    
    // 機器ごとにグループ化
    items.forEach(item => {
      if (!deviceGroups[item.device_id]) {
        deviceGroups[item.device_id] = {
          device_id: item.device_id,
          device_name: item.device_name,
          device_type: item.device_type,
          items: []
        };
      }
      
      deviceGroups[item.device_id].items.push({
        id: item.item_id,
        name: item.item_name,
        result: null // 初期値はnull
      });
    });
    
    // デバイスを設置場所（ラック）ごとにグループ化
    // 実際には設置場所情報があるとよいが、ない場合は機器ごとに仮のラックに割り振る
    const locationGroups = [
      {
        locationId: 'rack1',
        locationName: 'ラックNo.6',
        servers: []
      }
    ];
    
    // すべての機器を最初のラックに割り当てる
    Object.values(deviceGroups).forEach(device => {
      locationGroups[0].servers.push({
        id: device.device_name,
        type: device.device_type,
        items: device.items.map(item => item.name),
        results: new Array(device.items.length).fill(null)
      });
    });
    
    return locationGroups;
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
  
  // チェック状態が変更されたときに点検状態を更新
  useEffect(() => {
    if (!isStarted && hasAnyResults()) {
      setIsStarted(true);
    }
    
    if (!isComplete && allItemsChecked()) {
      setIsComplete(true);
    }
  }, [inspectionItems]);
  
  // 時間フォーマット関数
  const formatTime = (date) => {
    return date.toTimeString().substring(0, 5);
  };
  
  // 任意の点検結果が入力されているかチェック
  const hasAnyResults = () => {
    return inspectionItems.some(location => 
      location.servers.some(server => 
        server.results.some(result => result !== null)
      )
    );
  };
  
  // すべての点検項目がチェックされているかチェック
  const allItemsChecked = () => {
    return inspectionItems.every(location => 
      location.servers.every(server => 
        server.results.every(result => result !== null)
      )
    );
  };
  
  // 点検結果を更新する関数
  const updateResult = (locationIndex, serverIndex, itemIndex, isNormal) => {
    const newInspectionItems = [...inspectionItems];
    newInspectionItems[locationIndex].servers[serverIndex].results[itemIndex] = isNormal;
    setInspectionItems(newInspectionItems);
  };
  
  // 点検完了率を計算
  const calculateCompletionRate = () => {
    let total = 0;
    let completed = 0;
    
    inspectionItems.forEach(location => {
      location.servers.forEach(server => {
        server.results.forEach(result => {
          total++;
          if (result !== null) completed++;
        });
      });
    });
    
    return total > 0 ? Math.floor((completed / total) * 100) : 0;
  };
  
  // 点検結果を保存する関数
  const saveInspectionResults = async () => {
    try {
      setSaveStatus('saving');
      
      // 保存用のデータを構築
      const resultsData = {
        inspection_date: `${date.year}-${date.month}-${date.day}`,
        start_time: startTime,
        end_time: endTime,
        inspector_name: "システム管理者", // 実際のアプリケーションでは入力フィールドから取得
        device_id: inspectionItems[0]?.servers[0]?.device_id || 1, // 最初の機器のIDを使用
        results: []
      };
      
      // 各点検項目の結果を追加
      inspectionItems.forEach(location => {
        location.servers.forEach(server => {
          server.items.forEach((item, index) => {
            if (server.results[index] !== null) {
              resultsData.results.push({
                inspection_item_id: item.id || 1, // 実際のアプリケーションではitem.idを使用
                status: server.results[index] ? "正常" : "異常"
              });
            }
          });
        });
      });
      
      // APIで保存（実際のアプリケーションではこのAPI関数を実装）
      // await inspectionAPI.saveResults(resultsData);
      
      console.log('保存するデータ:', resultsData);
      
      // 成功したら状態を更新
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('');
        // 保存が完了したら点検一覧ページに戻る
        navigate('/inspections');
      }, 2000);
      
    } catch (error) {
      console.error('保存エラー:', error);
      setSaveStatus('error');
      setError('点検結果の保存に失敗しました。');
    }
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
          "0-1-0": false
        }
      };
      
      // 点検日と時間を設定
      setDate(previousData.date);
      setStartTime(previousData.startTime);
      setEndTime(previousData.endTime);
      
      // 点検結果を設定
      const newInspectionItems = [...inspectionItems];
      
      // 各結果をマッピング
      Object.entries(previousData.results).forEach(([key, value]) => {
        const [locIdx, srvIdx, itemIdx] = key.split('-').map(Number);
        if (newInspectionItems[locIdx]?.servers[srvIdx]?.results[itemIdx] !== undefined) {
          newInspectionItems[locIdx].servers[srvIdx].results[itemIdx] = value;
        }
      });
      
      setInspectionItems(newInspectionItems);
      setLoading(false);
      
    } catch (error) {
      console.error('前回データ読み込みエラー:', error);
      setError('前回の点検データの読み込みに失敗しました。');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="mx-auto bg-white p-6 rounded-lg shadow-lg max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">{customerName || '顧客名'} サーバ点検チェックシート</h1>
        <div className="bg-indigo-100 py-2 px-4 rounded-lg flex items-center mt-4 md:mt-0">
          <span className="font-semibold mr-2">点検実施時間:</span>
          <span className="text-indigo-700">08:00〜08:30</span>
        </div>
      </div>
      
      {error && <Alert type="danger" message={error} />}
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">年月日</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={date.year}
                onChange={(e) => setDate({...date, year: e.target.value})}
                className="w-16 px-2 py-1 border rounded" 
              />
              <span className="flex items-center">年</span>
              <input 
                type="text" 
                value={date.month}
                onChange={(e) => setDate({...date, month: e.target.value})}
                className="w-12 px-2 py-1 border rounded" 
              />
              <span className="flex items-center">月</span>
              <input 
                type="text" 
                value={date.day}
                onChange={(e) => setDate({...date, day: e.target.value})}
                className="w-12 px-2 py-1 border rounded" 
              />
              <span className="flex items-center">日</span>
            </div>
          </div>
          
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">開始時間</label>
            <div className="flex items-center">
              <input 
                type="text" 
                value={startTime || ""}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-20 px-2 py-1 border rounded" 
                placeholder="--:--"
              />
              <Clock className="ml-2 text-gray-500" size={18} />
            </div>
          </div>
          
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">終了時間</label>
            <div className="flex items-center">
              <input 
                type="text" 
                value={endTime || ""}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-20 px-2 py-1 border rounded" 
                placeholder="--:--"
              />
              <Clock className="ml-2 text-gray-500" size={18} />
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="bg-indigo-600 text-white rounded-lg h-full flex flex-col items-center justify-center p-2">
              <div className="text-sm">点検完了率</div>
              <div className="text-2xl font-bold">{calculateCompletionRate()}%</div>
              <div className="w-full bg-indigo-300 rounded-full h-2 mt-1">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${calculateCompletionRate()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">作業場所</label>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded" 
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">作業内容</label>
          <input 
            type="text" 
            value={workContent}
            onChange={(e) => setWorkContent(e.target.value)}
            className="w-full px-3 py-2 border rounded" 
          />
        </div>
      </div>
      
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
              {inspectionItems.map((location, locationIndex) => (
                location.servers.map((server, serverIndex) => (
                  server.items.map((item, itemIndex) => (
                    <tr 
                      key={`${locationIndex}-${serverIndex}-${itemIndex}`}
                      className={itemIndex === 0 && serverIndex === 0 ? 'border-t-2 border-gray-400' : ''}
                    >
                      {/* 場所 - 最初の項目でのみ表示 */}
                      {itemIndex === 0 && serverIndex === 0 ? (
                        <td 
                          className="px-4 py-2 border-b"
                          rowSpan={location.servers.reduce((acc, srv) => acc + srv.items.length, 0)}
                        >
                          <div className="font-semibold">{location.locationName}</div>
                        </td>
                      ) : null}
                      
                      {/* サーバ名 - 各サーバの最初の項目でのみ表示 */}
                      {itemIndex === 0 ? (
                        <td 
                          className="px-4 py-2 border-b"
                          rowSpan={server.items.length}
                        >
                          <div className="whitespace-pre-line">{server.id}</div>
                        </td>
                      ) : null}
                      
                      {/* 機種 - 各サーバの最初の項目でのみ表示 */}
                      {itemIndex === 0 ? (
                        <td 
                          className="px-4 py-2 border-b"
                          rowSpan={server.items.length}
                        >
                          <div className="whitespace-pre-line">{server.type}</div>
                        </td>
                      ) : null}
                      
                      {/* 点検項目 */}
                      <td className="px-4 py-2 border-b">
                        <div className="text-sm">{item}</div>
                      </td>
                      
                      {/* 点検結果 */}
                      <td className="px-4 py-2 border-b">
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => updateResult(locationIndex, serverIndex, itemIndex, true)}
                            className={`px-4 py-1 rounded-md font-semibold ${
                              server.results[itemIndex] === true 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            正常
                          </button>
                          <button
                            onClick={() => updateResult(locationIndex, serverIndex, itemIndex, false)}
                            className={`px-4 py-1 rounded-md font-semibold ${
                              server.results[itemIndex] === false 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            異常
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600"
          onClick={loadPreviousData}
        >
          前回の点検データを表示
        </button>
        <button 
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
          onClick={saveInspectionResults}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              保存中...
            </>
          ) : (
            '点検結果を保存'
          )}
        </button>
      </div>
    </div>
  );
};

export default ServerInspectionSheet;

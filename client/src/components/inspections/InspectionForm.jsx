import React, { useState, useEffect } from 'react';
import { Clock, Save, RotateCcw, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ServerInspectionSystem = () => {
  // 状態管理
  const [inspectionDate, setInspectionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  
  // DBからデータを取得する
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 現在の日付を設定
        const today = new Date();
        setInspectionDate(today.toISOString().split('T')[0]);
        
        // 顧客情報を取得
        const customerResponse = await axios.get('/api/customers/1'); // 帯広市役所のID
        setCustomerInfo(customerResponse.data);
        
        // 点検項目マスタを取得
        const itemsResponse = await axios.get(`/api/inspection-items?customerId=${customerResponse.data.id}`);
        
        // データを場所でグループ化
        const groupedItems = groupInspectionItemsByLocation(itemsResponse.data);
        setInspectionItems(groupedItems);
        
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの読み込みに失敗しました。');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 点検項目をロケーションでグループ化する関数
  const groupInspectionItemsByLocation = (items) => {
    const groupedData = {};
    
    items.forEach(item => {
      const locationId = item.location_id;
      const locationName = item.location_name;
      const serverId = item.server_id;
      const serverName = item.server_name;
      const serverType = item.server_type;
      
      if (!groupedData[locationId]) {
        groupedData[locationId] = {
          locationId,
          locationName,
          servers: {}
        };
      }
      
      const serverKey = `${serverId}_${serverType}`;
      if (!groupedData[locationId].servers[serverKey]) {
        groupedData[locationId].servers[serverKey] = {
          id: serverId,
          name: serverName,
          type: serverType,
          items: []
        };
      }
      
      groupedData[locationId].servers[serverKey].items.push({
        id: item.id,
        description: item.description,
        result: null
      });
    });
    
    // オブジェクトを配列に変換
    return Object.values(groupedData).map(location => {
      return {
        ...location,
        servers: Object.values(location.servers)
      };
    });
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
        server.items.some(item => item.result !== null)
      )
    );
  };
  
  // すべての点検項目がチェックされているかチェック
  const allItemsChecked = () => {
    return inspectionItems.every(location => 
      location.servers.every(server => 
        server.items.every(item => item.result !== null)
      )
    );
  };
  
  // 点検結果を更新する関数
  const updateResult = (locationIndex, serverIndex, itemIndex, isNormal) => {
    const newInspectionItems = [...inspectionItems];
    newInspectionItems[locationIndex].servers[serverIndex].items[itemIndex].result = isNormal;
    setInspectionItems(newInspectionItems);
  };
  
  // 点検完了率を計算
  const calculateCompletionRate = () => {
    let total = 0;
    let completed = 0;
    
    inspectionItems.forEach(location => {
      location.servers.forEach(server => {
        server.items.forEach(item => {
          total++;
          if (item.result !== null) completed++;
        });
      });
    });
    
    return total > 0 ? Math.floor((completed / total) * 100) : 0;
  };
  
  // 点検結果をデータベースに保存する関数
  const saveInspectionResults = async () => {
    try {
      setSaveStatus('saving');
      
      // 保存用のデータを作成
      const resultsData = {
        inspection_date: inspectionDate,
        start_time: startTime,
        end_time: endTime,
        customer_id: customerInfo.id,
        results: []
      };
      
      // 各点検項目の結果を追加
      inspectionItems.forEach(location => {
        location.servers.forEach(server => {
          server.items.forEach(item => {
            if (item.result !== null) {
              resultsData.results.push({
                inspection_item_id: item.id,
                result: item.result ? 'normal' : 'abnormal',
                server_id: server.id,
                location_id: location.locationId
              });
            }
          });
        });
      });
      
      // APIにデータを送信
      await axios.post('/api/inspection-results', resultsData);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('保存エラー:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };
  
  // 前回の点検データを取得する関数
  const loadPreviousInspection = async () => {
    try {
      setLoading(true);
      
      // 最新の点検結果を取得
      const response = await axios.get(`/api/inspection-results/latest?customerId=${customerInfo.id}`);
      const prevInspection = response.data;
      
      // 日付と時間を設定
      setInspectionDate(prevInspection.inspection_date);
      setStartTime(prevInspection.start_time);
      setEndTime(prevInspection.end_time);
      
      // 結果を現在の点検項目に適用
      const updatedItems = inspectionItems.map(location => {
        const updatedServers = location.servers.map(server => {
          const updatedItems = server.items.map(item => {
            // 前回の結果を検索
            const prevResult = prevInspection.results.find(r => r.inspection_item_id === item.id);
            return {
              ...item,
              result: prevResult ? (prevResult.result === 'normal') : null
            };
          });
          
          return {
            ...server,
            items: updatedItems
          };
        });
        
        return {
          ...location,
          servers: updatedServers
        };
      });
      
      setInspectionItems(updatedItems);
      setIsStarted(true);
      setIsComplete(true);
      setLoading(false);
    } catch (err) {
      console.error('前回データ取得エラー:', err);
      setError('前回の点検データを取得できませんでした。');
      setLoading(false);
    }
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
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
        <p className="font-bold">エラー</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="mx-auto bg-white p-6 rounded-lg shadow-lg max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">
          {customerInfo?.name || '顧客'} サーバ点検チェックシート
        </h1>
        <div className="bg-indigo-100 py-2 px-4 rounded-lg flex items-center mt-4 md:mt-0">
          <span className="font-semibold mr-2">点検実施時間:</span>
          <span className="text-indigo-700">08:00〜08:30</span>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center">
          <div className="flex items-center mr-8 mb-2 md:mb-0">
            <label className="block text-gray-700 font-semibold mr-2">日付:</label>
            <input 
              type="date" 
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="px-2 py-1 border rounded" 
            />
          </div>
          
          <div className="flex items-center mr-8 mb-2 md:mb-0">
            <label className="block text-gray-700 font-semibold mr-2">開始:</label>
            <div className="flex items-center">
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-24 px-2 py-1 border rounded" 
              />
              <Clock className="ml-1 text-gray-500" size={16} />
            </div>
          </div>
          
          <div className="flex items-center mr-8 mb-2 md:mb-0">
            <label className="block text-gray-700 font-semibold mr-2">終了:</label>
            <div className="flex items-center">
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-24 px-2 py-1 border rounded" 
              />
              <Clock className="ml-1 text-gray-500" size={16} />
            </div>
          </div>
          
          <div className="flex-grow flex items-center justify-end">
            <div className="bg-indigo-600 text-white rounded-lg py-2 px-4 flex items-center">
              <div className="mr-2">点検完了率</div>
              <div className="text-xl font-bold">{calculateCompletionRate()}%</div>
              <div className="w-24 bg-indigo-300 rounded-full h-2 ml-2">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${calculateCompletionRate()}%` }}
                ></div>
              </div>
            </div>
          </div>
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
                          <div className="whitespace-pre-line">{server.name}</div>
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
                        <div className="text-sm">{item.description}</div>
                      </td>
                      
                      {/* 点検結果 */}
                      <td className="px-4 py-2 border-b">
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => updateResult(locationIndex, serverIndex, itemIndex, true)}
                            className={`px-4 py-1 rounded-md font-semibold ${
                              item.result === true 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            正常
                          </button>
                          <button
                            onClick={() => updateResult(locationIndex, serverIndex, itemIndex, false)}
                            className={`px-4 py-1 rounded-md font-semibold ${
                              item.result === false 
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
      
      <div className="flex justify-between items-center">
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 flex items-center"
          onClick={loadPreviousInspection}
        >
          <RotateCcw className="mr-2" size={18} />
          前回の点検データを表示
        </button>
        
        <div className="flex items-center">
          {saveStatus === 'success' && (
            <div className="mr-4 text-green-600 flex items-center">
              <CheckCircle className="mr-1" size={20} />
              保存しました
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mr-4 text-red-600">
              保存に失敗しました
            </div>
          )}
          
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={saveInspectionResults}
            disabled={!hasAnyResults() || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
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
        </div>
      </div>
    </div>
  );
};

export default ServerInspectionSystem;

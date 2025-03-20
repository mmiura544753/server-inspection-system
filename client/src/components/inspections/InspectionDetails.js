// src/components/inspections/InspectionDetails.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import Modal from "../common/Modal";

const InspectionDetails = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 点検データの取得
  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setLoading(true);
        const data = await inspectionAPI.getById(id);
        setInspection(data);
        setError(null);
      } catch (err) {
        setError("点検データの取得に失敗しました。");
        console.error(`点検ID:${id}の取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id]);

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("ja-JP", options);
  };

  // 時刻フォーマット
  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // HH:MM 形式で表示
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert type="danger" message={error} />
        <Link to="/inspections" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          点検一覧に戻る
        </Link>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container py-4">
        <Alert type="warning" message="点検データが見つかりません。" />
        <Link to="/inspections" className="btn btn-primary">
          <FaArrowLeft className="me-2" />
          点検一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0">点検詳細</h1>
          <div>
            <Link
              to={`/inspections/edit/${id}`}
              className="btn btn-warning me-2"
            >
              <FaEdit className="me-2" />
              編集
            </Link>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-2" />
              削除
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">基本情報</h2>
            <div className="flex flex-wrap items-center space-x-6">
              <div className="mb-2">
                <span className="font-semibold mr-2">点検日:</span>
                <span>{formatDate(inspection.inspection_date)}</span>
              </div>
              <div className="mb-2">
                <span className="font-semibold mr-2">開始時間:</span>
                <span>{formatTime(inspection.start_time)}</span>
              </div>
              <div className="mb-2">
                <span className="font-semibold mr-2">終了時間:</span>
                <span>{formatTime(inspection.end_time)}</span>
              </div>
              <div className="mb-2">
                <span className="font-semibold mr-2">点検者:</span>
                <span>{inspection.inspector_name}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="h4">点検結果</h2>
            {inspection.results && inspection.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border-b w-24">ラックNo.</th>
                      <th className="px-4 py-2 border-b w-28">ユニット</th>
                      <th className="px-4 py-2 border-b w-40">サーバ名</th>
                      <th className="px-4 py-2 border-b w-32">機種</th>
                      <th className="px-4 py-2 border-b">点検項目</th>
                      <th className="px-4 py-2 text-center border-b w-48">点検結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // 結果をラックNo.と機器情報でグループ化
                      const groupedResults = [];
                      let currentGroup = null;
                      
                      // まず結果をグループ化
                      inspection.results.forEach(result => {
                        const rackNumber = result.rack_number || '-';
                        const deviceKey = `${rackNumber}-${result.unit_position || '-'}-${result.device_name || '-'}-${result.model || '-'}`;
                        
                        if (!currentGroup || currentGroup.deviceKey !== deviceKey) {
                          // 新しい機器グループを作成
                          currentGroup = {
                            rackNumber,
                            deviceKey,
                            device: {
                              rack_number: result.rack_number,
                              unit_position: result.unit_position,
                              device_name: result.device_name,
                              model: result.model
                            },
                            items: []
                          };
                          groupedResults.push(currentGroup);
                        }
                        
                        // このグループに結果を追加
                        currentGroup.items.push(result);
                      });
                      
                      // ラックNo.でのグループ化のためのマップを作成
                      const rackGroups = {};
                      groupedResults.forEach(group => {
                        const rackNumber = group.rackNumber;
                        if (!rackGroups[rackNumber]) {
                          rackGroups[rackNumber] = [];
                        }
                        rackGroups[rackNumber].push(group);
                      });
                      
                      // JSXを生成
                      const rows = [];
                      
                      Object.entries(rackGroups).forEach(([rackNumber, groups]) => {
                        // 各ラックグループの最初の行にだけラックNo.を表示
                        let isFirstInRack = true;
                        const totalRowsInRack = groups.reduce((total, group) => total + group.items.length, 0);
                        
                        groups.forEach(group => {
                          // 各デバイスグループの最初の行にだけデバイス情報を表示
                          const deviceRowCount = group.items.length;
                          
                          group.items.forEach((result, itemIndex) => {
                            const row = (
                              <tr key={result.id}>
                                {/* ラックNo.は各ラックグループの最初の行にのみ表示 */}
                                {isFirstInRack && (
                                  <td className="align-middle" rowSpan={totalRowsInRack}>
                                    <div>
                                      <span>ラックNo.{rackNumber}</span>
                                    </div>
                                  </td>
                                )}
                                
                                {/* デバイス情報は各デバイスの最初の行にのみ表示 */}
                                {itemIndex === 0 && (
                                  <>
                                    <td className="align-middle" rowSpan={deviceRowCount}>
                                      {group.device.unit_position || '-'}
                                    </td>
                                    <td className="align-middle" rowSpan={deviceRowCount}>
                                      {group.device.device_name || '-'}
                                    </td>
                                    <td className="align-middle" rowSpan={deviceRowCount}>
                                      {group.device.model || '-'}
                                    </td>
                                  </>
                                )}
                                
                                {/* 点検項目と結果は全ての行に表示 */}
                                <td>{result.check_item}</td>
                                <td className="px-4 py-2 border-b">
                                  <div className="flex justify-center">
                                    <span
                                      className={`px-4 py-1 rounded-md font-semibold ${
                                        result.status === "正常"
                                          ? "bg-green-500 text-white"
                                          : "bg-red-500 text-white"
                                      }`}
                                    >
                                      {result.status}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                            
                            rows.push(row);
                            
                            // 最初の行のフラグを更新
                            if (isFirstInRack) {
                              isFirstInRack = false;
                            }
                          });
                        });
                      });
                      
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">点検結果がありません。</div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <Link to="/inspections" className="btn btn-secondary">
            <FaArrowLeft className="me-2" />
            点検一覧に戻る
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="点検削除の確認"
        onConfirm={async () => {
          try {
            await inspectionAPI.delete(id);
            window.location.href = "/inspections";
          } catch (err) {
            setError("点検の削除に失敗しました。");
            setShowDeleteModal(false);
          }
        }}
      >
        <p>点検ID「{inspection.id}」の記録を削除してもよろしいですか？</p>
        <p className="text-danger">
          削除すると、この点検に関連するすべての詳細データも削除されます。
          この操作は元に戻せません。
        </p>
      </Modal>
    </div>
  );
};

export default InspectionDetails;

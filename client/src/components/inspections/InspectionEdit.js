// src/components/inspections/InspectionEdit.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// 同じ日付かどうかを確認するヘルパー関数
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// バリデーションスキーマ
const InspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("点検日は必須です"),
  inspector_name: Yup.string()
    .required("点検者名は必須です")
    .max(50, "点検者名は50文字以内で入力してください"),
  start_time: Yup.string().required("開始時間は必須です"),
  end_time: Yup.string().required("終了時間は必須です"),
  results: Yup.array().of(
    Yup.object().shape({
      status: Yup.string().required("ステータスは必須です"),
      checked_at: Yup.date()
        .required("確認日時は必須です")
        .test(
          'same-day',
          '確認日時は点検日と同じ日付である必要があります',
          function(value) {
            const { inspection_date } = this.parent;
            return isSameDay(value, inspection_date);
          }
        ),
    })
  ),
});

const InspectionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInspectionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inspectionAPI.getById(id);
      
      // フォーマットを整える
      const formattedData = {
        ...data,
        inspection_date: data.inspection_date ? new Date(data.inspection_date) : new Date(),
        results: data.results.map(result => ({
          ...result,
          checked_at: result.checked_at ? new Date(result.checked_at) : new Date(),
        })),
      };
      
      setInspection(formattedData);
      setError(null);
    } catch (err) {
      console.error(`点検ID:${id}の取得エラー:`, err);
      setError("点検データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspectionDetails();
  }, [fetchInspectionDetails]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      
      // APIに送信するデータを整形
      const formattedValues = {
        ...values,
        inspection_date: values.inspection_date.toISOString().split('T')[0],
        results: values.results.map(result => ({
          ...result,
          checked_at: result.checked_at.toISOString(),
        })),
      };
      
      await inspectionAPI.update(id, formattedValues);
      navigate(`/inspections/${id}`);
    } catch (err) {
      console.error(`点検データ更新エラー:`, err);
      setError("点検データの更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!inspection) {
    return (
      <div className="container mx-auto p-4">
        {error && <Alert type="danger" message={error} />}
        <div className="bg-gray-100 p-4 rounded text-center">
          点検データが見つかりません
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate("/inspections")}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-indigo-600 text-white p-4">
          <h1 className="text-2xl font-bold">点検結果の編集</h1>
        </div>

        {error && <Alert type="danger" message={error} />}

        <div className="p-4">
          <Formik
            initialValues={inspection}
            validationSchema={InspectionSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 border-b pb-2">点検基本情報</h2>
                  <div className="flex flex-wrap items-end space-x-4">
                    <div className="mb-4">
                      <label htmlFor="inspection_date" className="block text-sm font-medium text-gray-700 mb-1">
                        点検日 <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        selected={values.inspection_date}
                        onChange={(date) => {
                          setFieldValue("inspection_date", date);
                          
                          // 点検日が変更されたら、すべての確認日時の日付部分を同期する
                          if (values.results && values.results.length > 0) {
                            values.results.forEach((result, index) => {
                              if (result.checked_at) {
                                const currentTime = new Date(result.checked_at);
                                const newDate = new Date(date);
                                newDate.setHours(currentTime.getHours());
                                newDate.setMinutes(currentTime.getMinutes());
                                setFieldValue(`results.${index}.checked_at`, newDate);
                              }
                            });
                          }
                        }}
                        dateFormat="yyyy/MM/dd"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="inspection_date" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間 <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="time"
                        name="start_time"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="start_time" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                        終了時間 <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="time"
                        name="end_time"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="end_time" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="inspector_name" className="block text-sm font-medium text-gray-700 mb-1">
                        点検者名 <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="inspector_name"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="inspector_name" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 border-b pb-2">点検結果の編集</h2>
                  {values.results && values.results.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                              ラックNo.
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                              ユニット
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              サーバ名
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              機種
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              点検項目
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              点検結果
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            // 結果をラックNo.と機器情報でグループ化
                            const groupedResults = [];
                            let currentGroup = null;
                            
                            // まず結果をグループ化
                            values.results.forEach(result => {
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
                              currentGroup.items.push({...result, originalIndex: groupedResults.length - 1});
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
                                  const resultIndex = values.results.findIndex(r => r.id === result.id);
                                  
                                  const row = (
                                    <tr key={result.id}>
                                      {/* ラックNo.は各ラックグループの最初の行にのみ表示 */}
                                      {isFirstInRack && (
                                        <td className="px-4 py-2 align-middle" rowSpan={totalRowsInRack}>
                                          <div>
                                            <span>ラックNo.{rackNumber}</span>
                                          </div>
                                        </td>
                                      )}
                                      
                                      {/* デバイス情報は各デバイスの最初の行にのみ表示 */}
                                      {itemIndex === 0 && (
                                        <>
                                          <td className="px-4 py-2 align-middle" rowSpan={deviceRowCount}>
                                            {group.device.unit_position || '-'}
                                          </td>
                                          <td className="px-4 py-2 align-middle" rowSpan={deviceRowCount}>
                                            {group.device.device_name || '-'}
                                          </td>
                                          <td className="px-4 py-2 align-middle" rowSpan={deviceRowCount}>
                                            {group.device.model || '-'}
                                          </td>
                                        </>
                                      )}
                                      
                                      {/* 点検項目と結果は全ての行に表示 */}
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {result.check_item}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        <div className="flex justify-center space-x-4">
                                          <Field
                                            type="radio"
                                            id={`results.${resultIndex}.status.正常`}
                                            name={`results.${resultIndex}.status`}
                                            value="正常"
                                            className="hidden"
                                          />
                                          <label
                                            htmlFor={`results.${resultIndex}.status.正常`}
                                            className={`px-4 py-1 rounded-md font-semibold cursor-pointer ${
                                              values.results[resultIndex].status === "正常"
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-200 text-gray-600"
                                            }`}
                                          >
                                            正常
                                          </label>
                                          
                                          <Field
                                            type="radio"
                                            id={`results.${resultIndex}.status.異常`}
                                            name={`results.${resultIndex}.status`}
                                            value="異常"
                                            className="hidden"
                                          />
                                          <label
                                            htmlFor={`results.${resultIndex}.status.異常`}
                                            className={`px-4 py-1 rounded-md font-semibold cursor-pointer ${
                                              values.results[resultIndex].status === "異常"
                                                ? "bg-red-500 text-white"
                                                : "bg-gray-200 text-gray-600"
                                            }`}
                                          >
                                            異常
                                          </label>
                                        </div>
                                        <ErrorMessage
                                          name={`results.${resultIndex}.status`}
                                          component="div"
                                          className="text-red-500 text-xs mt-1"
                                        />
                                        
                                        {/* 確認日時は表示しないが、フォームには含める */}
                                        <div className="hidden">
                                          <DatePicker
                                            selected={values.results[resultIndex].checked_at}
                                            onChange={(date) => setFieldValue(`results.${resultIndex}.checked_at`, date)}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="yyyy/MM/dd HH:mm"
                                          />
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
                    <div className="bg-gray-100 p-4 rounded text-center">
                      点検結果データがありません
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                  >
                    {isSubmitting ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/inspections/${id}`)}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                  >
                    キャンセル
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default InspectionEdit;
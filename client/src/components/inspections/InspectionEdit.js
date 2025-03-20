// src/components/inspections/InspectionEdit.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { inspectionAPI } from "../../services/api";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

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
      checked_at: Yup.date().required("確認日時は必須です"),
    })
  ),
});

const InspectionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInspectionDetails();
  }, [id]);

  const fetchInspectionDetails = async () => {
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
  };

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="inspection_date" className="block text-sm font-medium text-gray-700 mb-1">
                        点検日 <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        selected={values.inspection_date}
                        onChange={(date) => setFieldValue("inspection_date", date)}
                        dateFormat="yyyy/MM/dd"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="inspection_date" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="inspector_name" className="block text-sm font-medium text-gray-700 mb-1">
                        点検者名 <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="inspector_name"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="inspector_name" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間 <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="time"
                        name="start_time"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <ErrorMessage name="end_time" component="div" className="text-red-500 text-sm mt-1" />
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
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              点検項目
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ステータス
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              確認日時
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {values.results.map((result, index) => (
                            <tr key={result.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {result.check_item}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <div className="flex items-center">
                                  <label className="inline-flex items-center mr-4">
                                    <Field
                                      type="radio"
                                      name={`results.${index}.status`}
                                      value="正常"
                                      className="form-radio h-4 w-4 text-indigo-600"
                                    />
                                    <span className="ml-2 text-green-600">正常</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <Field
                                      type="radio"
                                      name={`results.${index}.status`}
                                      value="異常"
                                      className="form-radio h-4 w-4 text-indigo-600"
                                    />
                                    <span className="ml-2 text-red-600">異常</span>
                                  </label>
                                </div>
                                <ErrorMessage
                                  name={`results.${index}.status`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <DatePicker
                                  selected={values.results[index].checked_at}
                                  onChange={(date) => setFieldValue(`results.${index}.checked_at`, date)}
                                  showTimeSelect
                                  timeFormat="HH:mm"
                                  timeIntervals={15}
                                  dateFormat="yyyy/MM/dd HH:mm"
                                  className="form-input rounded-md shadow-sm"
                                />
                                <ErrorMessage
                                  name={`results.${index}.checked_at`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </td>
                            </tr>
                          ))}
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
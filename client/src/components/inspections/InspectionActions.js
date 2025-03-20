// src/components/inspections/InspectionActions.js
import React from "react";

const InspectionActions = ({
  loadPreviousData,
  saveInspectionResults,
  saveStatus,
  error,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <button
          className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600"
          onClick={loadPreviousData}
        >
          前回の点検データを表示
        </button>
        <button
          className={`px-6 py-2 ${
            saveStatus === "error"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          } text-white rounded-lg shadow`}
          onClick={saveInspectionResults}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              保存中...
            </>
          ) : saveStatus === "success" ? (
            "保存完了!"
          ) : saveStatus === "error" ? (
            "保存失敗 - 再試行"
          ) : (
            "点検結果を保存"
          )}
        </button>
      </div>

      {/* エラーメッセージの表示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">保存エラー</p>
          <p>{error}</p>
          <p className="text-sm mt-2">
            お手数ですが、以下をご確認ください:
            <br />
            ・少なくとも1つの点検項目に結果を入力してください
            <br />
            ・すべての必須フィールド（日付、開始/終了時間）が入力されているか確認してください
            <br />
            問題が解決しない場合は管理者にお問い合わせください。
          </p>
        </div>
      )}

      {saveStatus === "success" && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          点検結果が正常に保存されました。点検一覧ページへ移動します...
        </div>
      )}
    </div>
  );
};

export default InspectionActions;

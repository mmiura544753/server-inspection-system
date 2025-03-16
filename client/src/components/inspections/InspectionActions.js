// src/components/inspections/InspectionActions.js
import React from "react";

const InspectionActions = ({ loadPreviousData, saveInspectionResults, saveStatus }) => {
  return (
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
        ) : (
          "点検結果を保存"
        )}
      </button>
    </div>
  );
};

export default InspectionActions;

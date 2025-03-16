// src/components/inspections/InspectionHeader.js
import React from "react";
import { FaClock } from "react-icons/fa"; // react-iconsからFaClockをインポート
import Alert from "../common/Alert";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // スタイルシートのインポート

const InspectionHeader = ({
  customerName,
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  calculateCompletionRate,
  error,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">
          {customerName || "顧客名"} サーバ点検チェックシート
        </h1>
        <div className="bg-indigo-100 py-2 px-4 rounded-lg flex items-center mt-4 md:mt-0">
          <span className="font-semibold mr-2">点検実施時間:</span>
          <span className="text-indigo-700">08:00〜08:30</span>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">
              年月日
            </label>
            <DatePicker
              selected={date}
              onChange={(date) => setDate(date)}
              dateFormat="yyyy/MM/dd"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">
              開始時間
            </label>
            <div className="flex items-center">
              <input
                type="time"
                value={startTime || ""}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-20 px-2 py-1 border rounded"
              />
              <FaClock className="ml-2 text-gray-500" size={18} />
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-1">
              終了時間
            </label>
            <div className="flex items-center">
              <input
                type="time"
                value={endTime || ""}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-20 px-2 py-1 border rounded"
              />
              <FaClock className="ml-2 text-gray-500" size={18} />
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-indigo-600 text-white rounded-lg h-full flex flex-col items-center justify-center p-2">
              <div className="text-sm">点検完了率</div>
              <div className="text-2xl font-bold">
                {calculateCompletionRate()}%
              </div>
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
    </>
  );
};

export default InspectionHeader;

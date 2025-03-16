// src/components/inspections/InspectionForm.js
import React from "react";

const InspectionForm = ({
  location,
  setLocation,
  workContent,
  setWorkContent,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-gray-700 font-semibold mb-1">
          作業場所
        </label>
        <input
          type="text"
          value={location}
          readOnly
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-1">
          作業内容
        </label>
        <input
          type="text"
          value={workContent}
          readOnly
          onChange={(e) => setWorkContent(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  );
};

export default InspectionForm;

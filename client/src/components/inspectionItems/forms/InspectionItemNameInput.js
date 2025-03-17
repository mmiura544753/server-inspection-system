// src/components/inspectionItems/forms/InspectionItemNameInput.js
import React from 'react';
import { Field, ErrorMessage } from 'formik';

const InspectionItemNameInput = () => {
  return (
    <div className="mb-3">
      <label
        htmlFor="item_name"
        className="form-label required-label"
      >
        点検項目名
      </label>
      <Field
        type="text"
        id="item_name"
        name="item_name"
        className="form-control"
        placeholder="点検項目名を入力"
      />
      <ErrorMessage
        name="item_name"
        component="div"
        className="text-danger"
      />
    </div>
  );
};

export default InspectionItemNameInput;
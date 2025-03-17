// src/components/devices/forms/Devicerack_numberForm.js
import React from "react";
import { Field, ErrorMessage } from "formik";

/**
 * 機器の設置場所情報を入力するコンポーネント
 */
const DeviceLocationForm = () => {
  return (
    <div className="mb-4">
      <h4 className="mb-3">設置場所情報</h4>

      <div className="mb-3">
        <label htmlFor="rack_number" className="form-label">
          設置ラックNo.
        </label>
        <Field
          type="number"
          id="rack_number"
          name="rack_number"
          className="form-control"
          placeholder="ラック番号を入力 (例: 8)"
          min="1"
          data-testid="rack-number-input"
        />
        <ErrorMessage
          name="rack_number"
          component="div"
          className="text-danger"
        />
        <small className="form-text text-muted">
          設置されているラックの番号を入力してください
        </small>
      </div>
      
      <div className="mb-3">
        <label htmlFor="unit_position" className="form-label">
          ユニット位置
        </label>
        <Field
          type="text"
          id="unit_position"
          name="unit_position"
          className="form-control"
          placeholder="例: U1-U2"
          data-testid="unit-position-input"
        />
        <ErrorMessage
          name="unit_position"
          component="div"
          className="text-danger"
        />
        <small className="form-text text-muted">
          ラックの搭載位置を入力してください（例: U1-U2）
        </small>
      </div>
    </div>
  );
};

export default DeviceLocationForm;

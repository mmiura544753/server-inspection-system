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

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="unit_start_position" className="form-label">
            ユニット開始位置
          </label>
          <Field
            type="number"
            id="unit_start_position"
            name="unit_start_position"
            className="form-control"
            placeholder="例: 1"
            min="1"
            max="99"
            data-testid="unit-start-position-input"
          />
          <ErrorMessage
            name="unit_start_position"
            component="div"
            className="text-danger"
          />
          <small className="form-text text-muted">
            ラックの搭載開始位置を数値で入力してください（例: 1）
          </small>
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="unit_end_position" className="form-label">
            ユニット終了位置
          </label>
          <Field
            type="number"
            id="unit_end_position"
            name="unit_end_position"
            className="form-control"
            placeholder="例: 2"
            min="1"
            max="99"
            data-testid="unit-end-position-input"
          />
          <ErrorMessage
            name="unit_end_position"
            component="div"
            className="text-danger"
          />
          <small className="form-text text-muted">
            ラックの搭載終了位置を数値で入力してください（単一ユニットの場合は開始位置と同じ値を入力）
          </small>
        </div>
      </div>
    </div>
  );
};

export default DeviceLocationForm;

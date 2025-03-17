// src/components/devices/forms/DeviceBasicInfoForm.js
import React from "react";
import { Field, ErrorMessage } from "formik";
import PropTypes from "prop-types";

/**
 * 機器の基本情報（顧客、機器名、モデル）を入力するコンポーネント
 * 
 * @param {Object} props コンポーネントのプロパティ
 * @param {Array} props.customers 顧客一覧データ
 */
const DeviceBasicInfoForm = ({ customers }) => {
  return (
    <div className="mb-4">
      <h4 className="mb-3">基本情報</h4>
      
      <div className="mb-3">
        <label
          htmlFor="customer_id"
          className="form-label required-label"
        >
          顧客
        </label>
        <Field
          as="select"
          id="customer_id"
          name="customer_id"
          className="form-select"
          data-testid="customer-select"
        >
          <option value="">顧客を選択してください</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customer_name}
            </option>
          ))}
        </Field>
        <ErrorMessage
          name="customer_id"
          component="div"
          className="text-danger"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="device_name"
          className="form-label required-label"
        >
          機器名
        </label>
        <Field
          type="text"
          id="device_name"
          name="device_name"
          className="form-control"
          placeholder="機器名を入力"
          data-testid="device-name-input"
        />
        <ErrorMessage
          name="device_name"
          component="div"
          className="text-danger"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="model" className="form-label">
          モデル
        </label>
        <Field
          type="text"
          id="model"
          name="model"
          className="form-control"
          placeholder="モデル名を入力"
          data-testid="model-input"
        />
        <ErrorMessage
          name="model"
          component="div"
          className="text-danger"
        />
        <small className="form-text text-muted">
          具体的な製品名やモデル番号を入力してください
        </small>
      </div>
    </div>
  );
};

DeviceBasicInfoForm.propTypes = {
  customers: PropTypes.array.isRequired
};

export default DeviceBasicInfoForm;

// src/components/devices/forms/DeviceTypeForm.js
import React from "react";
import { Field, ErrorMessage } from "formik";

/**
 * 機器の種別とハードウェアタイプを選択するコンポーネント
 */
const DeviceTypeForm = () => {
  // 機器種別の選択肢
  const deviceTypes = [
    { value: "サーバ", label: "サーバ" },
    { value: "UPS", label: "UPS" },
    { value: "ネットワーク機器", label: "ネットワーク機器" },
    { value: "その他", label: "その他" }
  ];

  // ハードウェアタイプの選択肢
  const hardwareTypes = [
    { value: "物理", label: "物理" },
    { value: "VM", label: "仮想マシン (VM)" }
  ];

  return (
    <div className="mb-4">
      <h4 className="mb-3">機器タイプ</h4>

      <div className="mb-3">
        <label
          htmlFor="device_type"
          className="form-label required-label"
        >
          機器種別
        </label>
        <Field
          as="select"
          id="device_type"
          name="device_type"
          className="form-select"
          data-testid="device-type-select"
        >
          {deviceTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Field>
        <ErrorMessage
          name="device_type"
          component="div"
          className="text-danger"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="hardware_type"
          className="form-label required-label"
        >
          ハードウェアタイプ
        </label>
        <Field
          as="select"
          id="hardware_type"
          name="hardware_type"
          className="form-select"
          data-testid="hardware-type-select"
        >
          {hardwareTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Field>
        <ErrorMessage
          name="hardware_type"
          component="div"
          className="text-danger"
        />
        <small className="form-text text-muted">
          物理マシンか仮想マシンかを選択してください
        </small>
      </div>
    </div>
  );
};

export default DeviceTypeForm;

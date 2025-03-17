// src/components/devices/forms/FormActionButtons.js
import React from "react";
import { Link } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import PropTypes from "prop-types";

/**
 * フォームの送信・キャンセルボタンを表示するコンポーネント
 * 
 * @param {Object} props コンポーネントのプロパティ
 * @param {boolean} props.isSubmitting 送信中かどうか
 */
const FormActionButtons = ({ isSubmitting }) => {
  return (
    <div className="mt-4 d-flex justify-content-between">
      <Link to="/devices" className="btn btn-secondary">
        <FaTimes className="me-2" />
        キャンセル
      </Link>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting}
        data-testid="save-button"
      >
        <FaSave className="me-2" />
        {isSubmitting ? "保存中..." : "保存する"}
      </button>
    </div>
  );
};

FormActionButtons.propTypes = {
  isSubmitting: PropTypes.bool
};

FormActionButtons.defaultProps = {
  isSubmitting: false
};

export default FormActionButtons;

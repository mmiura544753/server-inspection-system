// src/components/inspectionItems/forms/FormActionButtons.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';

const FormActionButtons = ({ isSubmitting }) => {
  return (
    <div className="mt-4 d-flex justify-content-between">
      <Link to="/inspection-items" className="btn btn-secondary">
        <FaTimes className="me-2" />
        キャンセル
      </Link>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting}
      >
        <FaSave className="me-2" />
        {isSubmitting ? "保存中..." : "保存する"}
      </button>
    </div>
  );
};

export default FormActionButtons;
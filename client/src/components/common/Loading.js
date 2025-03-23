// src/components/common/Loading.js
import React from 'react';

const Loading = () => {
  return (
    <div className="loading-spinner" data-testid="loading-spinner">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">読み込み中...</span>
      </div>
      <span className="ms-3">読み込み中...</span>
    </div>
  );
};

export default Loading;

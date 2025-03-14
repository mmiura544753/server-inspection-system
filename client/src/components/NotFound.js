// src/components/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-5">
      <h1 className="display-1">404</h1>
      <h2>ページが見つかりません</h2>
      <p>アクセスしようとしたページは存在しないか、移動した可能性があります。</p>
      <Link to="/" className="btn btn-primary">ホームに戻る</Link>
    </div>
  );
};

export default NotFound;

// src/components/devices/DeviceSearch.js
import React from 'react';
import { FaSearch } from 'react-icons/fa';

// 機器検索フォームコンポーネント
const DeviceSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="input-group">
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="機器名、顧客名、モデルで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceSearch;

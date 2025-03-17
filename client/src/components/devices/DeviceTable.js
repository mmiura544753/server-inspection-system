// src/components/devices/DeviceTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

// 機器一覧表示テーブルコンポーネント
const DeviceTable = ({ devices, onDeleteClick }) => {
  return (
    <>
      {devices.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>機器名</th>
                    <th>顧客</th>
                    <th>モデル</th>
                    <th>種別</th>
                    <th>ハードウェア</th>
                    <th>設置ラックNo.</th>
                    <th>ユニット位置</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>{device.id}</td>
                      <td>{device.device_name}</td>
                      <td>{device.customer_name}</td>
                      <td>{device.model || "-"}</td>
                      <td>{device.device_type}</td>
                      <td>{device.hardware_type}</td>
                      <td>{device.rack_number || "-"}</td>
                      <td>{device.unit_position || "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/devices/${device.id}`}
                            className="btn btn-sm btn-info"
                            title="詳細"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/devices/edit/${device.id}`}
                            className="btn btn-sm btn-warning"
                            title="編集"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            title="削除"
                            onClick={() => onDeleteClick(device)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          検索条件に一致する機器はありません。
        </div>
      )}
    </>
  );
};

export default DeviceTable;

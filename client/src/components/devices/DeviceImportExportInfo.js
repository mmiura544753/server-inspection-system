// src/components/devices/DeviceImportExportInfo.js
import React from 'react';

// CSVインポート・エクスポート情報コンポーネント
const DeviceImportExportInfo = () => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">CSVインポート・エクスポートについて</h5>
        <p className="mb-0">
          <strong>CSVエクスポート</strong>:
          現在の機器一覧をSJIS形式のCSVファイルでダウンロードします。
        </p>
        <p className="mb-0">
          <strong>CSVインポート</strong>:
          CSVファイルから機器情報を一括登録します。ファイル形式はSJISエンコーディングが推奨です。
        </p>
        <p className="small text-muted mt-2">
          インポート用CSVのフォーマット:
          機器名、顧客名、モデル、設置場所、ユニット位置、機器種別、ハードウェアタイプのカラムが必要です。
          IDが指定されている場合は更新、指定がない場合は新規作成されます。存在しない顧客名の場合は自動的に新規顧客が作成されます。
        </p>
      </div>
    </div>
  );
};

export default DeviceImportExportInfo;

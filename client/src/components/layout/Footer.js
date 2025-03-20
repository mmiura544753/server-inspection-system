// src/components/layout/Footer.js
import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = "0.1.0"; // 手動でバージョン番号を設定

  return (
    <footer className="app-footer">
      <div className="container d-flex justify-content-between align-items-center">
        <p className="m-0">
          © {currentYear} Zukosha Co., Ltd. All rights reserved.
        </p>
        <p className="m-0">
          v{appVersion}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

// src/components/layout/Footer.js
import React from "react";
import { version } from "../../../package.json";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container d-flex justify-content-between align-items-center">
        <p className="m-0">
          © {currentYear} Zukosha Co., Ltd. All rights reserved.
        </p>
        <p className="m-0">
          v{version}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

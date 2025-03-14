// src/components/layout/Footer.js
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="container">
        <p className="m-0">© {currentYear} サーバー点検管理システム</p>
      </div>
    </footer>
  );
};

export default Footer;

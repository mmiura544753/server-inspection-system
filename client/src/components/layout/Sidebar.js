// src/components/layout/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaUsers,
  FaServer,
  FaClipboardCheck,
  FaChartBar,
  FaList,
} from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink
              to="/inspections/new"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaClipboardCheck className="me-2" /> 点検作業
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/inspections"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaList className="me-2" /> 点検結果管理
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/inspection-items"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaList className="me-2" /> 点検項目マスタ
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/devices"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaServer className="me-2" /> 機器管理
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaUsers className="me-2" /> 顧客管理
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? "sidebar-active" : "")}
            >
              <FaChartBar className="me-2" /> レポート
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

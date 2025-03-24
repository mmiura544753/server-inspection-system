// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// レイアウトコンポーネント
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

// 顧客コンポーネント
import CustomerList from "./components/customers/CustomerList";
import CustomerForm from "./components/customers/CustomerForm";
import CustomerDetails from "./components/customers/CustomerDetails";

// 機器コンポーネント;
import DeviceList from "./components/devices/DeviceList";
import DeviceForm from "./components/devices/DeviceForm";
import DeviceDetails from "./components/devices/DeviceDetails";

// 点検作業コンポーネント
import InspectionList from "./components/inspections/InspectionList";
import ServerInspectionSheet from "./components/inspections/ServerInspectionSheet"; // 新しい点検シートコンポーネント
import InspectionDetails from "./components/inspections/InspectionDetails";
import InspectionEdit from "./components/inspections/InspectionEdit";

// 点検項目マスタコンポーネント
import InspectionItemList from "./components/inspectionItems/InspectionItemList";
import InspectionItemForm from "./components/inspectionItems/InspectionItemForm";

// 点検項目名マスタコンポーネント
import InspectionItemNameList from "./components/inspectionItemNames/InspectionItemNameList";
import InspectionItemNameForm from "./components/inspectionItemNames/InspectionItemNameForm";

// レポートコンポーネント
import ReportList from "./components/reports/ReportList";
import ReportGenerate from "./components/reports/ReportGenerate";

// その他のページ
import Home from "./components/Home";
import NotFound from "./components/NotFound";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="content-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* 顧客関連のルート */}
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/edit/:id" element={<CustomerForm />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              {/* 機器関連のルート */}
              <Route path="/devices" element={<DeviceList />} />
              <Route path="/devices/new" element={<DeviceForm />} />
              <Route path="/devices/edit/:id" element={<DeviceForm />} />
              <Route path="/devices/:id" element={<DeviceDetails />} />
              {/* 点検作業関連のルート */}
              <Route
                path="/inspections"
                element={<InspectionList />}
              />
              <Route
                path="/inspections/new"
                element={<ServerInspectionSheet />}
              />
              <Route
                path="/inspections/edit/:id"
                element={<InspectionEdit />}
              />
              <Route path="/inspections/:id" element={<InspectionDetails />} />
              {/* 点検項目マスタ関連のルート */}
              <Route
                path="/inspection-items"
                element={<InspectionItemList />}
              />
              <Route
                path="/inspection-items/new"
                element={<InspectionItemForm />}
              />
              <Route
                path="/inspection-items/edit/:id"
                element={<InspectionItemForm />}
              />
              {/* 点検項目名マスタ関連のルート */}
              <Route
                path="/inspection-item-names"
                element={<Navigate to="/inspection-item-names/list" replace />}
              />
              <Route
                path="/inspection-item-names/list"
                element={<InspectionItemNameList />}
              />
              <Route
                path="/inspection-item-names/new"
                element={<InspectionItemNameForm />}
              />
              <Route
                path="/inspection-item-names/edit/:id"
                element={<InspectionItemNameForm />}
              />
              {/* レポート関連のルート */}
              <Route path="/reports" element={<ReportList />} />
              <Route path="/reports/generate" element={<ReportGenerate />} />
              {/* 404ページ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Footer />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;

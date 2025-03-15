// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// レイアウトコンポーネント
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

// 顧客コンポーネント
import CustomerList from "./components/customers/CustomerList";
import CustomerForm from "./components/customers/CustomerForm";
import CustomerDetails from "./components/customers/CustomerDetails";

// src/App.js に機器関連のルートを追加
import DeviceList from "./components/devices/DeviceList";

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
              {/* 後で追加する機器関連のルート
              <Route path="/devices/new" element={<DeviceForm />} />
              <Route path="/devices/edit/:id" element={<DeviceForm />} />
              <Route path="/devices/:id" element={<DeviceDetails />} />
              */}

              {/* 404ページ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

// src/components/Home.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaServer,
  FaClipboardCheck,
  FaList,
  FaPlay,
} from "react-icons/fa";

const Home = () => {
  return (
    <div className="container py-4">
      <div className="p-5 mb-4 bg-light rounded-3 text-center">
        <div className="container-fluid">
          <h1 className="display-5 fw-bold">サーバー点検管理システム</h1>
          <p className="fs-4 mt-3">
            サーバーやネットワーク機器の点検作業を効率的に管理するシステムです。
            顧客情報、機器情報、点検結果を一元管理できます。
          </p>
        </div>
      </div>

      <div className="row align-items-md-stretch">
        <div className="col-md-6">
          <div className="h-100 p-5 text-white bg-primary rounded-3">
            <h2>点検作業を開始</h2>
            <p>新しい点検作業を開始するか、進行中の点検作業を確認します。</p>
            <Link to="/inspections/new" className="btn btn-outline-light">
              点検作業へ
            </Link>
          </div>
        </div>
        <div className="col-md-6">
          <div className="h-100 p-5 bg-light border rounded-3">
            <h2>マスタ管理</h2>
            <p>顧客情報や機器情報などのマスタデータを管理します。</p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/inspection-items" className="btn btn-outline-primary">
                点検項目
              </Link>
              <Link to="/devices" className="btn btn-outline-secondary">
                機器管理
              </Link>
              <Link to="/customers" className="btn btn-outline-dark">
                顧客管理
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <FaList className="fs-1 text-info mb-3" />
              <h5 className="card-title">点検項目</h5>
              <Link to="/inspection-items" className="btn btn-sm btn-info">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <FaClipboardCheck className="fs-1 text-primary mb-3" />
              <h5 className="card-title">点検作業</h5>
              <Link to="/inspections" className="btn btn-sm btn-primary">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <FaServer className="fs-1 text-success mb-3" />
              <h5 className="card-title">機器管理</h5>
              <Link to="/devices" className="btn btn-sm btn-success">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <FaUsers className="fs-1 text-primary mb-3" />
              <h5 className="card-title">顧客管理</h5>
              <Link to="/customers" className="btn btn-sm btn-primary">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

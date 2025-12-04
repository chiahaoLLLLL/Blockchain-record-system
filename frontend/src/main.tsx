/**
 * Application Entry Point / 应用入口
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// 🚨 必须导入 BrowserRouter 并将其别名为 Router
import { BrowserRouter as Router } from "react-router-dom"; 
// 🚨 必须导入 WalletProvider
import { WalletProvider } from "./hooks/useWallet"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ✅ 1. 路由器必须是顶级容器 */}
    <Router> 
      {/* ✅ 2. WalletProvider 应该紧跟其后 */}
      <WalletProvider>
        <App />
      </WalletProvider>
    </Router>
  </React.StrictMode>
);
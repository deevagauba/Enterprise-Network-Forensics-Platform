import React from 'react';
import '../styles/topbar.css';

export default function TopBar({ onToggleSidebar }) {
  return (
    <div className="top-bar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
      </div>
      <div className="topbar-center">
        ENTERPRISE NETWORK FORENSICS PLATFORM
      </div>
      <div className="topbar-right">
        <div className="status-dot pulse-glow-green" />
        <span className="status-text">SYSTEM ONLINE</span>
      </div>
    </div>
  );
}
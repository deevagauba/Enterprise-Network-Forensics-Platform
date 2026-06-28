import React from 'react';
import '../styles/sidebar.css';

export default function Sidebar({ width }) {
  return (
    <div 
      className="sidebar-container"
      style={{ width }}
    >
      <div style={{ height: '52px', borderBottom: '1px solid rgba(180,120,255,0.1)' }}></div>
      <div className="sidebar-body">
        <ul className="sidebar-nav">
          <li className="nav-item">
            <span>◒</span> <span>Dashboard</span>
          </li>
          <li className="nav-item-disabled">
            <span>⚡</span> <span>Threat Hunt</span>
          </li>
          <li className="nav-item-disabled">
            <span>⚙</span> <span>Settings</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
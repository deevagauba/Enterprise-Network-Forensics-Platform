import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TopologyVisualizer from './components/TopologyVisualizer';
import ServicesPanel from './components/ServicesPanel';
import AclEngine from './components/AclEngine';
import IntrusionConsole from './components/IntrusionConsole';
import FlaggedHosts from './components/FlaggedHosts';
import StatsBar from './components/StatsBar';

const FSBtn = ({ panelId, fullscreenPanelId }) => {
  const toggleFullscreen = (e) => {
    const panel = e.currentTarget.closest('.panel');
    if (!document.fullscreenElement) {
      panel.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button className="fs-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
      {fullscreenPanelId === panelId ? '✕' : '⛶'}
    </button>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leasesData, setLeasesData] = useState(null);
  const [leasesError, setLeasesError] = useState(false);
  const [aclHits, setAclHits] = useState({ "110": 0, "120": 0 });
  const [fullscreenPanelId, setFullscreenPanelId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5005/api/leases')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setLeasesData(data))
      .catch(err => {
        console.error(err);
        setLeasesError(true);
      });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setFullscreenPanelId(document.fullscreenElement.id);
      } else {
        setFullscreenPanelId(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleExport = async (format) => {
    try {
      const res = await fetch(`http://localhost:5005/api/export-report?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forensics-report.${format}`;
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };



  return (
    <div className="app-shell">
      <Sidebar width={sidebarOpen ? '200px' : '0px'} />
      <div className="main-content">
        <TopBar onToggleSidebar={() => setSidebarOpen(p => !p)} />
        <StatsBar />

        {/* NEW INTENTIONAL SCROLL LAYOUT */}
        <div className="dashboard-scroll-area">

          {/* SECTION 1: Network Overview */}
          <div className="dashboard-section section-overview">
            <div className="panel" id="topology-panel">
              <div className="panel-header">
                <span>Topology Visualizer</span>
                <FSBtn panelId="topology-panel" fullscreenPanelId={fullscreenPanelId} />
              </div>
              <div className="panel-body p-0">
                <TopologyVisualizer />
              </div>
            </div>

            <div className="panel" id="services-panel">
              <div className="panel-header">
                <span>Infrastructure Services</span>
                <FSBtn panelId="services-panel" fullscreenPanelId={fullscreenPanelId} />
              </div>
              <div className="panel-body p-0">
                <ServicesPanel data={leasesData} error={leasesError} />
              </div>
            </div>
          </div>

          {/* SECTION 2: Active Threats */}
          <div className="dashboard-section section-threats">
            <div id="console-panel" className="panel panel-terminal p-0">
              <div className="panel-header">
                <span>Intrusion Console</span>
                <FSBtn panelId="console-panel" fullscreenPanelId={fullscreenPanelId} />
              </div>
              <div className="panel-body p-0">
                <IntrusionConsole onExport={handleExport} />
              </div>
            </div>
          </div>

          {/* SECTION 3: Forensic Evidence */}
          <div className="dashboard-section section-evidence">
            <div className="panel" id="acl-panel">
              <div className="panel-header">
                <span>ACL & Security Policy Engine</span>
                <FSBtn panelId="acl-panel" fullscreenPanelId={fullscreenPanelId} />
              </div>
              <div className="panel-body">
                <AclEngine hits={aclHits} setHits={setAclHits} />
              </div>
            </div>

            <div id="flagged-hosts-panel" className="panel">
              <div className="panel-header">
                <span>Flagged Hosts</span>
                <FSBtn panelId="flagged-hosts-panel" fullscreenPanelId={fullscreenPanelId} />
              </div>
              <div className="panel-body">
                <FlaggedHosts />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
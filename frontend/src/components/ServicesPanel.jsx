import React, { useState } from 'react';
import '../styles/services.css';

export default function ServicesPanel({ data, error }) {
  const [activeTab, setActiveTab] = useState('dhcp');

  if (error) return <div className="p-4 text-red" style={{ padding: '1rem' }}>Failed to load — check backend</div>;
  if (!data) return <div className="p-4 text-slate" style={{ padding: '1rem' }}>Loading...</div>;

  return (
    <div className="services-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'dhcp' ? 'active' : ''}`} onClick={() => setActiveTab('dhcp')}>DHCP</button>
        <button className={`tab-btn ${activeTab === 'dns' ? 'active' : ''}`} onClick={() => setActiveTab('dns')}>DNS</button>
        <button className={`tab-btn ${activeTab === 'ssh' ? 'active' : ''}`} onClick={() => setActiveTab('ssh')}>SSH</button>
      </div>

      {/* Clean flex scrolling container */}
      <div className="tab-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'dhcp' && (
          <div className="table-responsive-wrapper" style={{ overflow: 'auto', flex: 1 }}>
            <table>
              <thead><tr><th>Pool Name</th><th>Assigned IP</th><th>MAC Address</th><th>VLAN</th><th>Status</th></tr></thead>
              <tbody>
                {data.leases?.map((l, i) => (
                  <tr key={i}>
                    <td>VLAN_{l.vlan}_POOL</td>
                    <td className="text-cyan">{l.ip}</td>
                    <td>{l.mac}</td>
                    <td>{l.vlan}</td>
                    <td><span className="badge badge-green">ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'dns' && (
          <div className="table-responsive-wrapper" style={{ overflow: 'auto', flex: 1 }}>
            <table>
              <thead><tr><th>Hostname</th><th>Record Type</th><th>IP</th><th>Status</th></tr></thead>
              <tbody>
                {data.dns?.map((d, i) => (
                  <tr key={i}>
                    <td>{d.hostname}</td>
                    <td>{d.record_type}</td>
                    <td className="text-green">{d.ip}</td>
                    <td><span className="badge badge-green">RESOLVED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ssh' && (
          <div className="table-responsive-wrapper" style={{ overflow: 'auto', flex: 1 }}>
            <table>
              <thead><tr><th>Timestamp</th><th>Source IP</th><th>Target SVI</th><th>User</th><th>Status</th></tr></thead>
              <tbody>
                {data.ssh_logs?.map((s, i) => (
                  <tr key={i}>
                    <td>{s.timestamp}</td>
                    <td>{s.source}</td>
                    <td className="text-cyan">{s.target}</td>
                    <td>{s.user}</td>
                    <td><span className={`badge ${s.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
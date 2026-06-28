import React, { useState, useEffect, useRef } from 'react';

export default function FlaggedHosts() {
  const [hosts, setHosts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const previousHostsRef = useRef({});
  const [flashList, setFlashList] = useState([]);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await fetch('http://localhost:5005/api/flagged-hosts');
        const data = await res.json();
        
        const newFlash = [];
        data.forEach(host => {
          if (!previousHostsRef.current[host.ip]) {
            newFlash.push(host.ip);
          }
        });
        
        if (newFlash.length > 0) {
          setFlashList(prev => [...prev, ...newFlash]);
          setTimeout(() => {
            setFlashList(prev => prev.filter(ip => !newFlash.includes(ip)));
          }, 1500);
        }
        
        const newRef = {};
        data.forEach(h => newRef[h.ip] = true);
        previousHostsRef.current = newRef;
        
        setHosts(data);
      } catch (err) {
        console.error("Failed to fetch flagged hosts:", err);
      }
    };

    fetchHosts();
    const interval = setInterval(fetchHosts, 3000);
    return () => clearInterval(interval);
  }, []);

  const getThreatBadge = (level) => {
    switch(level) {
      case 'HIGH': return <span className="badge" style={{ background: 'rgba(255,85,119,0.15)', color: '#ff5577', border: '1px solid #ff5577' }}>HIGH</span>;
      case 'MEDIUM': return <span className="badge" style={{ background: 'rgba(255,204,102,0.15)', color: '#ffcc66', border: '1px solid #ffcc66' }}>MEDIUM</span>;
      case 'LOW': return <span className="badge" style={{ background: 'rgba(127,255,159,0.15)', color: '#7fff9f', border: '1px solid #7fff9f' }}>LOW</span>;
      default: return <span className="badge">{level}</span>;
    }
  };

  const getViolationBadge = (type) => {
    switch (type) {
      case 'Port Scan': return <span className="badge" style={{ background: 'rgba(180,120,255,0.1)', color: '#b47fff', border: '1px solid #b47fff' }}>🔍 {type}</span>;
      case 'SSH Brute Force': return <span className="badge" style={{ background: 'rgba(255,204,102,0.15)', color: '#ffcc66', border: '1px solid #ffcc66' }}>🔑 {type}</span>;
      case 'ACL Violation': return <span className="badge" style={{ background: 'rgba(255,85,119,0.15)', color: '#ff5577', border: '1px solid #ff5577' }}>🚫 {type}</span>;
      case 'Denial of Service': return <span className="badge" style={{ background: 'rgba(255,85,119,0.15)', color: '#ff5577', border: '1px solid #ff5577' }}>⚡ {type}</span>;
      default: return <span className="badge">{type}</span>;
    }
  };

  const getProbabilityBar = (prob) => {
    let color = '#7fff9f';
    if (prob > 0.60 && prob <= 0.80) color = '#ffcc66';
    if (prob > 0.80) color = '#ff5577';
    const pct = Math.round(prob * 100);
    return (
      <div style={{ position: 'relative', height: '18px', width: '100px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s ease' }} />
        <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#1a1025', fontWeight: 'bold' }}>{pct}%</span>
      </div>
    );
  };

  const filters = [
    { label: 'ALL', value: 'ALL' },
    { label: 'PORT SCAN', value: 'Port Scan' },
    { label: 'SSH BRUTE FORCE', value: 'SSH Brute Force' },
    { label: 'ACL VIOLATION', value: 'ACL Violation' },
    { label: 'DoS', value: 'Denial of Service' }
  ];

  const filteredHosts = hosts.filter(h => filter === 'ALL' || h.violation_type === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Flagged Hosts</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {filters.map(f => (
            <button 
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: filter === f.value ? 'rgba(180,120,255,0.15)' : 'transparent',
                border: filter === f.value ? '1px solid #b47fff' : '1px solid rgba(180,120,255,0.2)',
                color: filter === f.value ? '#b47fff' : 'rgba(240,230,255,0.4)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body p-0" style={{ overflowY: 'auto' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>IP Address</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Violation Type</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Flagged At</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Threat Level</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Probability</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Hit Count</th>
            </tr>
          </thead>
          <tbody>
            {hosts.length === 0 ? (
              <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '16px', color: 'rgba(240,230,255,0.5)' }}>No flagged hosts yet.</td></tr>
            ) : filteredHosts.length === 0 ? (
              <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '16px', color: 'rgba(240,230,255,0.5)' }}>No {filter} threats detected.</td></tr>
            ) : (
              filteredHosts.map(host => (
                <tr 
                  key={host.ip} 
                  style={{ backgroundColor: flashList.includes(host.ip) ? 'rgba(255,85,119,0.2)' : 'transparent', transition: 'background-color 0.5s ease' }}
                >
                  <td className="font-monospace" style={{ padding: '12px', color: '#d4aaff' }}>{host.ip}</td>
                  <td style={{ padding: '12px' }}>{getViolationBadge(host.violation_type)}</td>
                  <td style={{ padding: '12px', color: 'rgba(240,230,255,0.5)' }}>{host.flagged_at}</td>
                  <td style={{ padding: '12px' }}>{getThreatBadge(host.threat_level)}</td>
                  <td style={{ padding: '12px' }}>{getProbabilityBar(host.probability)}</td>
                  <td style={{ padding: '12px', color: '#ffcc66' }}>{host.hit_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import '../styles/acl.css';

export default function AclEngine({ hits, setHits }) {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5005/api/acl-hits')
        .then(res => res.json())
        .then(data => {
          setHits(data);
        })
        .catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, [setHits]);

  return (
    <div className="acl-container">
      <div className="acl-cards">
        <div className={`acl-card ${hits["110"] > 0 ? "actively-blocking" : ""}`}>
          <div className="acl-card-header">
            <span className="lock-icon">🔒</span> <span className="rule-title">ACL 110</span>
          </div>
          <div className="rule-details">
            <span className="rule-route">FINANCE → HR</span>
            <span className="badge badge-blocked">BLOCKED</span>
          </div>
          <div className="rule-subtitle">Denies all traffic from Finance VLAN to HR VLAN</div>
          {hits["110"] > 0 && <div className="rule-timestamp">Last triggered: Just now ({hits["110"]} hits)</div>}
        </div>
        
        <div className={`acl-card ${hits["120"] > 0 ? "actively-blocking" : ""}`}>
          <div className="acl-card-header">
            <span className="lock-icon">🔒</span> <span className="rule-title">ACL 120</span>
          </div>
          <div className="rule-details">
            <span className="rule-route">ATTACKER → SERVERS</span>
            <span className="badge badge-blocked">BLOCKED</span>
          </div>
          <div className="rule-subtitle">Denies all traffic from Attacker VLAN to Servers VLAN</div>
          {hits["120"] > 0 && <div className="rule-timestamp">Last triggered: Just now ({hits["120"]} hits)</div>}
        </div>
      </div>

      <div className="port-security-section">
        <h4 className="port-security-header">Port Security Status</h4>
        <div className="table-responsive-wrapper">
          <table className="acl-table">
            <thead>
              <tr>
                <th>Switch</th>
                <th>Interface</th>
                <th>MAC Learning</th>
                <th>Violation Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HR-SW</td>
                <td>fa0/1-24</td>
                <td>Dynamic</td>
                <td>Shutdown</td>
                <td><span className="badge badge-green">SECURE</span></td>
              </tr>
              <tr>
                <td>FIN-SW</td>
                <td>fa0/1-24</td>
                <td>Sticky</td>
                <td>Shutdown</td>
                <td><span className="badge badge-green">SECURE</span></td>
              </tr>
              <tr>
                <td>IT-SW</td>
                <td>fa0/5</td>
                <td style={{color: '#b47fff'}}>Static (00:1A:2B:3C:4D:90)</td>
                <td>Restrict</td>
                <td><span className="badge badge-amber">MONITORING</span></td>
              </tr>
              <tr>
                <td>SERVER-SW</td>
                <td>gi0/1-4</td>
                <td>Static</td>
                <td>Protect</td>
                <td><span className="badge badge-green">SECURE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
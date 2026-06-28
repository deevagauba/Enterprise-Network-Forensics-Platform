import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/console.css';

const ATTACK_TYPES = [
  { value: 'acl_violation', label: 'ACL VIOLATION' },
  { value: 'port_scan', label: 'PORT SCAN' },
  { value: 'ssh_brute_force', label: 'SSH BRUTE FORCE' },
  { value: 'dos', label: 'DoS ATTACK' }
];

export default function IntrusionConsole({ onExport }) {
  const [allLogs, setAllLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [attackType, setAttackType] = useState('acl_violation');
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  
  const [filterProtocol, setFilterProtocol] = useState('ALL');
  const [filterReason, setFilterReason] = useState('ALL');
  const [filterIp, setFilterIp] = useState('');
  
  const terminalRef = useRef(null);
  
  // Keep a ref of the latest selected attack so the auto-loop can fire it immediately
  // without causing React dependency cycle re-renders.
  const selectedAttackRef = useRef(attackType);
  useEffect(() => {
    selectedAttackRef.current = attackType;
  }, [attackType]);

  // 1. Fetch raw logs from the backend on interval
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:5005/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setAllLogs(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  // 2. Drip-feed the logs one by one
  useEffect(() => {
    // If backend is cleared, clear the frontend immediately
    if (allLogs.length === 0) {
      setDisplayedLogs([]);
      return;
    }
    
    const allLen = allLogs.length;
    const dispLen = displayedLogs.length;

    if (allLen > dispLen) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => {
          // Double check the length condition using functional state update
          if (prev.length < allLogs.length) {
            return [...prev, allLogs[prev.length]];
          }
          return prev;
        });
      }, 800); 
      
      return () => clearTimeout(timer);
    } else if (allLen < dispLen) {
       // Should be handled by length === 0, but as a safeguard, sync state
       setDisplayedLogs(allLogs);
    }
  }, [allLogs, displayedLogs.length]); 

  // 3. Smart Auto-Scroll
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    // Check if we are within ~150px of the bottom
    const isNearBottom = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 150;

    if (isNearBottom) {
      terminal.scrollTo({
        top: terminal.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayedLogs]); // Dependency on the actual displayed list

  // Execute single manual attack
  const simulateAttack = useCallback(async (type) => {
    try {
      await fetch('http://localhost:5005/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  }, []);

  // Continuous Attack Loop with Weighted Distribution
  useEffect(() => {
    let interval;
    if (isAutoSimulating) {
      // 1. Instantly fire the attack currently selected in the dropdown
      simulateAttack(selectedAttackRef.current);

      // 2. Begin the random cycle
      interval = setInterval(() => {
        const rand = Math.random();
        let nextAttack;
        
        // Weighted distribution to drastically reduce ACL violation spam
        if (rand < 0.10) {
          nextAttack = 'acl_violation';     // 10% chance
        } else if (rand < 0.30) {
          nextAttack = 'ssh_brute_force';   // 20% chance
        } else if (rand < 0.60) {
          nextAttack = 'dos';               // 30% chance
        } else {
          nextAttack = 'port_scan';         // 40% chance
        }
        
        setAttackType(nextAttack);
        simulateAttack(nextAttack);
      }, 3500); // 3.5 second delay gives the terminal more time to render bursts
    }
    return () => clearInterval(interval);
  }, [isAutoSimulating, simulateAttack]);

  const handleClear = async () => {
    try {
      await fetch('http://localhost:5005/api/logs', { method: 'DELETE' });
      setAllLogs([]);
      setDisplayedLogs([]);
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  const filteredLogs = displayedLogs.filter(log => {
    const src = (log.src_ip || log.source || '').toLowerCase();
    const dst = (log.dst_ip || log.target || '').toLowerCase();
    const protocol = (log.protocol || (log.user ? 'SSH' : 'TCP')).toUpperCase();
    const reason = (log.reason || log.message || (log.user ? `Failed login for ${log.user}` : 'UNKNOWN')).toUpperCase();
    const verdict = log.verdict || (log.status === 'SUCCESS' ? 'PERMIT' : 'DENY');

    const searchIp = filterIp.toLowerCase();
    const matchIp = !searchIp || src.includes(searchIp) || dst.includes(searchIp);
    const matchProtocol = filterProtocol === 'ALL' || protocol.includes(filterProtocol);

    let matchReason = true;
    if (filterReason !== 'ALL') {
      if (filterReason === 'NORMAL') {
        matchReason = verdict === 'PERMIT';
      } else if (filterReason === 'ACL') {
        matchReason = reason.includes('ACL');
      } else if (filterReason === 'SCAN') {
        matchReason = reason.includes('SCAN');
      } else if (filterReason === 'LOGIN') {
        matchReason = reason.includes('LOGIN') || reason.includes('BRUTE') || reason.includes('SSH');
      } else if (filterReason === 'DOS') {
        matchReason = reason.includes('DOS') || reason.includes('FLOOD');
      }
    }

    return matchIp && matchProtocol && matchReason;
  });

  const inputStyle = {
    background: 'rgba(14,8,22,0.8)',
    border: '1px solid rgba(180,120,255,0.3)',
    color: '#f0e6ff',
    padding: '4px 10px',
    borderRadius: '4px',
    fontFamily: 'var(--font-family)',
    fontSize: '0.75rem',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div className="console-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div className="console-toolbar" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
        <div className="d-flex-align-center">
          <select 
            value={attackType} 
            onChange={e => setAttackType(e.target.value)}
            className="attack-select"
            disabled={isAutoSimulating}
          >
            {ATTACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button 
            className="btn btn-simulate" 
            onClick={() => simulateAttack(attackType)}
            disabled={isAutoSimulating}
          >
            [SIMULATE]
          </button>
          
          <button 
            className={`btn ${isAutoSimulating ? 'btn-red pulse-glow' : 'btn-amber'}`} 
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
          >
            {isAutoSimulating ? '[AUTO: ON]' : '[AUTO: OFF]'}
          </button>
        </div>
        
        <div className="d-flex-align-center">
          <button className="btn btn-export" onClick={() => onExport('json')}>[EXPORT JSON]</button>
          <button className="btn btn-export" onClick={() => onExport('pdf')}>[EXPORT PDF]</button>
          <button className="btn btn-clear" onClick={handleClear}>[CLEAR LOG]</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', padding: '0 1.25rem 12px 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'transparent' }}>
        <select 
          style={inputStyle} 
          value={filterProtocol} 
          onChange={e => setFilterProtocol(e.target.value)}
        >
          <option value="ALL">Protocol: ALL</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
          <option value="SSH">SSH</option>
        </select>

        <select 
          style={inputStyle} 
          value={filterReason} 
          onChange={e => setFilterReason(e.target.value)}
        >
          <option value="ALL">Event: ALL</option>
          <option value="NORMAL">Normal Traffic (Permit)</option>
          <option value="ACL">ACL Violation</option>
          <option value="SCAN">Port Scan</option>
          <option value="LOGIN">SSH Brute Force</option>
          <option value="DOS">DoS Attack</option>
        </select>

        <input 
          type="text"
          placeholder="Filter by IP address..."
          value={filterIp}
          onChange={e => setFilterIp(e.target.value)}
          style={{ ...inputStyle, width: '200px', cursor: 'text' }}
        />
      </div>
      
      <div className="console-terminal" ref={terminalRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div className="console-line">
          <span style={{color: '#b47fff'}}>[SYSTEM] Stateful Threat Detection Engine initialized...</span>
        </div>
        
        {filteredLogs.length === 0 && (filterProtocol !== 'ALL' || filterReason !== 'ALL' || filterIp) && (
          <div className="console-line" style={{ color: 'rgba(240,230,255,0.5)', fontStyle: 'italic', marginTop: '8px' }}>
            [!] No logs match the current filter criteria...
          </div>
        )}
        
        {filteredLogs.map((log, i) => {
          const src = log.src_ip || log.source || 'UNKNOWN';
          const dst = log.dst_ip || log.target || 'UNKNOWN';
          const protocol = log.protocol || (log.user ? 'SSH' : 'TCP');
          const port = log.port || (log.user ? '22' : '---');
          const reason = log.reason || log.message || (log.user ? `Failed login for ${log.user}` : 'UNKNOWN EVENT');
          const verdict = log.verdict || (log.status === 'SUCCESS' ? 'PERMIT' : 'DENY');
          const threat = log.threat_level || (log.user ? 'HIGH' : 'MEDIUM');

          return (
            <div className="console-line" key={i} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(180,120,255,0.05)', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="log-timestamp">[{log.timestamp}]</span>
                <span className="log-src-dst">
                  SRC: <span className="log-src">{src}</span> <span className="log-arrow">→</span> DST: <span className="log-dst">{dst}</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', paddingLeft: '24px', fontSize: '0.9em', color: 'rgba(240,230,255,0.5)' }}>
                <span>PROTOCOL: <span style={{color: '#b47fff'}}>{protocol}</span></span>
                <span>PORT: <span style={{color: '#b47fff'}}>{port}</span></span>
                {log.acl && <span>ACL: <span style={{color: '#b47fff'}}>{log.acl}</span></span>}
              </div>
              <div style={{ display: 'flex', gap: '16px', paddingLeft: '24px', fontSize: '0.9em' }}>
                <span>REASON: <span className="text-light">{reason}</span></span>
                <span>VERDICT: <span className={verdict === 'DENY' ? 'verdict-deny' : 'verdict-permit'}>{verdict === 'DENY' ? '██ DENY ██' : 'PERMIT'}</span></span>
                <span>THREAT: <span className={threat === 'HIGH' ? 'threat-high' : threat === 'MEDIUM' ? 'threat-medium' : 'threat-low'}>{threat}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
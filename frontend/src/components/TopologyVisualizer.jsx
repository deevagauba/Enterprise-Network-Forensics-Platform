import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/topology.css';

export default function TopologyVisualizer() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [viewMode, setViewMode] = useState('logical');

  const containerRef = useRef(null);

  const canvasRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, panX: 0, panY: 0, zoom: 1 });
  const rafId = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5005/api/topology')
      .then(res => res.json())
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.setProperty('--scale', dragState.current.zoom);
      canvasRef.current.style.setProperty('--pan-x', `${dragState.current.panX}px`);
      canvasRef.current.style.setProperty('--pan-y', `${dragState.current.panY}px`);
    }
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.001;
    let newZoom = dragState.current.zoom + zoomFactor;
    newZoom = Math.min(Math.max(0.4, newZoom), 2.5);
    dragState.current.zoom = newZoom;

    if (canvasRef.current) {
      canvasRef.current.style.setProperty('--scale', newZoom);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current?.querySelector('.topology-viewport');
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('.topology-controls') || e.target.closest('.topology-legend')) return;
    dragState.current.isDragging = true;
    dragState.current.startX = e.clientX - dragState.current.panX;
    dragState.current.startY = e.clientY - dragState.current.panY;
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging) return;
    const newX = e.clientX - dragState.current.startX;
    const newY = e.clientY - dragState.current.startY;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      dragState.current.panX = newX;
      dragState.current.panY = newY;
      if (canvasRef.current) {
        canvasRef.current.style.setProperty('--pan-x', `${newX}px`);
        canvasRef.current.style.setProperty('--pan-y', `${newY}px`);
      }
    });
  };

  const handleMouseUp = () => dragState.current.isDragging = false;

  const handleZoomIn = () => {
    let newZoom = Math.min(dragState.current.zoom + 0.2, 2.5);
    dragState.current.zoom = newZoom;
    if (canvasRef.current) canvasRef.current.style.setProperty('--scale', newZoom);
  };
  const handleZoomOut = () => {
    let newZoom = Math.max(dragState.current.zoom - 0.2, 0.4);
    dragState.current.zoom = newZoom;
    if (canvasRef.current) canvasRef.current.style.setProperty('--scale', newZoom);
  };
  const handleReset = () => {
    dragState.current.zoom = 1;
    dragState.current.panX = 0;
    dragState.current.panY = 0;
    if (canvasRef.current) {
      canvasRef.current.style.setProperty('--scale', 1);
      canvasRef.current.style.setProperty('--pan-x', `0px`);
      canvasRef.current.style.setProperty('--pan-y', `0px`);
    }
  };

  const vlanBoxes = [
    { id: 10, name: "VLAN 10 (HR)", left: "100px", top: "130px", width: "150px", height: "280px", color: "#b47fff" },
    { id: 20, name: "VLAN 20 (FINANCE)", left: "400px", top: "130px", width: "150px", height: "280px", color: "#ffcc66" },
    { id: 30, name: "VLAN 30 (IT)", left: "700px", top: "130px", width: "150px", height: "280px", color: "#7fff9f" },
    { id: 40, name: "VLAN 40 (SERVERS)", left: "1000px", top: "130px", width: "150px", height: "280px", color: "#d4aaff" },
    { id: 50, name: "VLAN 50 (ATTACKER)", left: "525px", top: "520px", width: "200px", height: "100px", color: "#ff5577" },
  ];

  const logicalNodes = [
    { id: "R1", type: "router" },
    { id: "CORE-SW", type: "switch" },
    { id: "HR-SW", type: "switch" }, { id: "HR-PC-1", type: "pc" }, { id: "HR-PC-2", type: "pc" }, { id: "HR-PC-3", type: "pc" },
    { id: "FIN-SW", type: "switch" }, { id: "FINANCE-PC-1", type: "pc" }, { id: "FINANCE-PC-2", type: "pc" }, { id: "FINANCE-PC-3", type: "pc" },
    { id: "IT-SW", type: "switch" }, { id: "IT-PC-1", type: "pc" }, { id: "IT-PC-2", type: "pc" }, { id: "IT-PC-3", type: "pc" },
    { id: "SERVER-SW", type: "switch" }, { id: "DHCP-SERVER", type: "server" }, { id: "WEB-SERVER", type: "server" },
    { id: "ATTACKER-PC", type: "attacker" }
  ];

  const logicalLinks = [
    { source: "R1", target: "CORE-SW" },
    { source: "CORE-SW", target: "HR-SW" },
    { source: "CORE-SW", target: "FIN-SW" },
    { source: "CORE-SW", target: "IT-SW" },
    { source: "CORE-SW", target: "SERVER-SW" },
    { source: "HR-SW", target: "HR-PC-1" }, { source: "HR-PC-1", target: "HR-PC-2" }, { source: "HR-PC-2", target: "HR-PC-3" },
    { source: "FIN-SW", target: "FINANCE-PC-1" }, { source: "FINANCE-PC-1", target: "FINANCE-PC-2" }, { source: "FINANCE-PC-2", target: "FINANCE-PC-3" },
    { source: "IT-SW", target: "IT-PC-1" }, { source: "IT-PC-1", target: "IT-PC-2" }, { source: "IT-PC-2", target: "IT-PC-3" },
    { source: "SERVER-SW", target: "DHCP-SERVER" }, { source: "DHCP-SERVER", target: "WEB-SERVER" },
    { source: "CORE-SW", target: "ATTACKER-PC" }
  ];

  const logicalLayout = {
    "R1": { x: "625px", y: "30px", type: "router" },
    "CORE-SW": { x: "625px", y: "90px", type: "switch" },
    "HR-SW": { x: "175px", y: "170px", type: "switch" },
    "HR-PC-1": { x: "175px", y: "250px", type: "pc" },
    "HR-PC-2": { x: "175px", y: "310px", type: "pc" },
    "HR-PC-3": { x: "175px", y: "370px", type: "pc" },
    "FIN-SW": { x: "475px", y: "170px", type: "switch" },
    "FINANCE-PC-1": { x: "475px", y: "250px", type: "pc" },
    "FINANCE-PC-2": { x: "475px", y: "310px", type: "pc" },
    "FINANCE-PC-3": { x: "475px", y: "370px", type: "pc" },
    "IT-SW": { x: "775px", y: "170px", type: "switch" },
    "IT-PC-1": { x: "775px", y: "250px", type: "pc" },
    "IT-PC-2": { x: "775px", y: "310px", type: "pc" },
    "IT-PC-3": { x: "775px", y: "370px", type: "pc" },
    "SERVER-SW": { x: "1075px", y: "170px", type: "switch" },
    "DHCP-SERVER": { x: "1075px", y: "250px", type: "server" },
    "WEB-SERVER": { x: "1075px", y: "310px", type: "server" },
    "ATTACKER-PC": { x: "625px", y: "570px", type: "attacker" }
  };

  const ptTopology = {
    nodes: [
      { id: "R1", model: "2911", type: "router" },
      { id: "SW", model: "3560-24PS", type: "switch" },
      { id: "HR SW", model: "2960-24TT", type: "switch" },
      { id: "FIN SW", model: "2960-24TT", type: "switch" },
      { id: "SERVER SW", model: "2960-24TT", type: "switch" },
      { id: "IT SW", model: "2960-24TT", type: "switch" },
      { id: "HR PC1", model: "PC-PT", type: "pc" }, { id: "HR PC2", model: "PC-PT", type: "pc" }, { id: "HR PC3", model: "PC-PT", type: "pc" },
      { id: "FIN PC1", model: "PC-PT", type: "pc" }, { id: "FIN PC2", model: "PC-PT", type: "pc" }, { id: "FIN PC3", model: "PC-PT", type: "pc" },
      { id: "WEB SERVER", model: "Server-PT", type: "server" }, { id: "SYSLOG SERVER", model: "Server-PT", type: "server" }, { id: "DHCP SERVER", model: "Server-PT", type: "server" },
      { id: "attacker pc", model: "PC-PT", type: "attacker" }, { id: "IT PC1", model: "PC-PT", type: "pc" }, { id: "IT PC2", model: "PC-PT", type: "pc" }, { id: "IT PC3", model: "PC-PT", type: "pc" }
    ],
    links: [
      { source: "R1", target: "SW" },
      { source: "SW", target: "HR SW" },
      { source: "SW", target: "SERVER SW" },
      { source: "SW", target: "FIN SW" },
      { source: "SW", target: "IT SW" },
      { source: "HR SW", target: "HR PC1" }, { source: "HR SW", target: "HR PC2" }, { source: "HR SW", target: "HR PC3" },
      { source: "SERVER SW", target: "WEB SERVER" }, { source: "SERVER SW", target: "SYSLOG SERVER" }, { source: "SERVER SW", target: "DHCP SERVER" },
      { source: "FIN SW", target: "FIN PC1" }, { source: "FIN SW", target: "FIN PC2" }, { source: "FIN SW", target: "FIN PC3" },
      { source: "IT SW", target: "attacker pc" }, { source: "IT SW", target: "IT PC1" }, { source: "IT SW", target: "IT PC2" }, { source: "IT SW", target: "IT PC3" }
    ]
  };

  const ptLayout = {
    "R1": { x: "775px", y: "60px", type: "router" },
    "SW": { x: "775px", y: "180px", type: "switch" },
    "HR SW": { x: "250px", y: "350px", type: "switch" },
    "SERVER SW": { x: "600px", y: "350px", type: "switch" },
    "FIN SW": { x: "950px", y: "350px", type: "switch" },
    "IT SW": { x: "1300px", y: "350px", type: "switch" },
    "HR PC1": { x: "150px", y: "500px", type: "pc" },
    "HR PC2": { x: "250px", y: "500px", type: "pc" },
    "HR PC3": { x: "350px", y: "500px", type: "pc" },
    "WEB SERVER": { x: "500px", y: "500px", type: "server" },
    "SYSLOG SERVER": { x: "600px", y: "500px", type: "server" },
    "DHCP SERVER": { x: "700px", y: "500px", type: "server" },
    "FIN PC1": { x: "850px", y: "500px", type: "pc" },
    "FIN PC2": { x: "950px", y: "500px", type: "pc" },
    "FIN PC3": { x: "1050px", y: "500px", type: "pc" },
    "attacker pc": { x: "1200px", y: "500px", type: "attacker" },
    "IT PC1": { x: "1300px", y: "500px", type: "pc" },
    "IT PC2": { x: "1400px", y: "500px", type: "pc" },
    "IT PC3": { x: "1500px", y: "500px", type: "pc" }
  };

  const currentNodes = viewMode === 'logical' ? logicalNodes : ptTopology.nodes;
  const currentLinks = viewMode === 'logical' ? logicalLinks : ptTopology.links;
  const currentLayout = viewMode === 'logical' ? logicalLayout : ptLayout;

  return (
    <div className="topology-container" ref={containerRef}>
      <div className="topology-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item">
          <div className="device-node router static"><div className="device-icon">R</div></div>
          <span>Router</span>
        </div>
        <div className="legend-item">
          <div className="device-node switch static"><div className="device-icon">S</div></div>
          <span>Switch</span>
        </div>
        <div className="legend-item">
          <div className="device-node pc static"><div className="device-icon">D</div></div>
          <span>Endpoint</span>
        </div>
        <div className="legend-item">
          <div className="device-node server static"><div className="device-icon">D</div></div>
          <span>Server</span>
        </div>
        <div className="legend-item">
          <div className="device-node attacker static"><div className="device-icon">☠</div></div>
          <span>Attacker</span>
        </div>
      </div>

      <div
        className="topology-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="topology-canvas" ref={canvasRef}>
          {viewMode === 'logical' && vlanBoxes.map(b => (
            <div
              key={b.id}
              className={`vlan-box ${b.id === 50 ? 'attacker' : ''}`}
              style={{ "--vlan-x": b.left, "--vlan-y": b.top, "--vlan-w": b.width, "--vlan-h": b.height, "--vlan-color": b.color }}
            >
              <span className="vlan-label" style={{ "--vlan-color": b.color }}>{b.name}</span>
            </div>
          ))}

          <svg className="topology-svg-overlay">
            {viewMode === 'logical' && (
              <>
                <line x1="0" y1="480" x2="1600" y2="480" stroke="var(--accent-red)" strokeWidth="2" strokeDasharray="10,10" opacity="0.5" />
                <text x="50" y="470" fill="var(--accent-red)" fontSize="14" fontWeight="bold" opacity="0.8">TRUST BOUNDARY (QUARANTINED)</text>
              </>
            )}

            {currentLinks?.map(link => {
              const src = currentLayout[link.source];
              const tgt = currentLayout[link.target];
              if (!src || !tgt) return null;

              const sx = parseInt(src.x);
              const sy = parseInt(src.y);
              const tx = parseInt(tgt.x);
              const ty = parseInt(tgt.y);

              let pathD;

              if (viewMode === 'physical') {
                pathD = `M ${sx} ${sy} L ${tx} ${ty}`;
              } else {
                if (sx === tx) {
                  pathD = `M ${sx} ${sy} V ${ty}`;
                } else if (sy === ty) {
                  pathD = `M ${sx} ${sy} H ${tx}`;
                } else {
                  let midY = sy + (ty - sy) / 2;

                  if (link.source === "CORE-SW") {
                    // Stagger the horizontal lines by 8px each to create parallel tracks
                    if (link.target === "HR-SW") midY = 100;
                    else if (link.target === "FIN-SW") midY = 108;
                    else if (link.target === "IT-SW") midY = 116;
                    else if (link.target === "SERVER-SW") midY = 124;
                    else midY = 115; // Fallback
                  }

                  pathD = `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
                }
              }

              return (
                <path
                  key={`${link.source}-${link.target}`}
                  d={pathD}
                  className="topology-link"
                  fill="none"
                  stroke="#4d3270"
                  strokeWidth="2"
                  shapeRendering={viewMode === 'logical' ? "crispEdges" : "auto"}
                />
              )
            })}
          </svg>

          {currentNodes?.map(node => {
            const pos = currentLayout[node.id] || { x: "0%", y: "0%", type: "pc" };
            return (
              <div
                key={node.id}
                className={`device-node ${pos.type}`}
                style={{ "--node-x": pos.x, "--node-y": pos.y }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className="device-icon">
                  {pos.type === 'switch' ? 'S' : pos.type === 'router' ? 'R' : pos.type === 'attacker' ? '☠' : 'D'}
                </div>
                <div className="device-label">
                  {node.model && <div className="device-model">{node.model}</div>}
                  <div className="device-name">{node.id}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="topology-controls">
        <select
          value={viewMode}
          onChange={e => setViewMode(e.target.value)}
          className="topology-select"
        >
          <option value="logical">Logical (VLAN Segments)</option>
          <option value="physical">Physical (Packet Tracer)</option>
        </select>
        <button onClick={handleZoomIn} title="Zoom In">+</button>
        <button onClick={handleZoomOut} title="Zoom Out">-</button>
        <button onClick={handleReset} title="Reset Pan/Zoom">⟲</button>
      </div>

      {hoveredNode && (
        <div className="topology-tooltip">
          <div><strong>ID:</strong> {hoveredNode.id}</div>
          {hoveredNode.model && <div><strong>Model:</strong> {hoveredNode.model}</div>}
          <div><strong>Type:</strong> {(currentLayout[hoveredNode.id]?.type || hoveredNode.type || 'UNKNOWN').toUpperCase()}</div>
          {hoveredNode.vlan && <div><strong>VLAN:</strong> {hoveredNode.vlan}</div>}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function StatsBar() {
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const fetchEvents = () => {
      fetch('http://localhost:5005/api/events')
        .then(res => res.json())
        .then(data => setEventCount(data.length))
        .catch(err => console.error('Failed to fetch events:', err));
    };

    fetchEvents();
    const intervalId = setInterval(fetchEvents, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="stats-bar">
      <div className="stat-item">Total Devices: <span className="stat-value">15</span></div>
      <div className="stat-item">Active VLANs: <span className="stat-value">5</span></div>
      <div className="stat-item">ACL Rules: <span className="stat-value">2</span></div>
      <div className="stat-item">Forensic Events: <span className="stat-value">{eventCount}</span></div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import './CompatibilityBar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CompatibilityBar({ currentUserId, otherUserId }) {
  const [compat, setCompat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/users/${currentUserId}/compatibility/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        setCompat(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUserId, otherUserId]);

  if (loading) return <div className="compat-loading">⏳</div>;
  if (!compat || compat.error) return null;

  const getColor = (score) => {
    if (score >= 70) return '#1db954';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="compat-container">
      <div className="compat-bar-wrapper">
        <div 
          className="compat-bar-fill"
          style={{ 
            width: `${compat.score}%`,
            background: getColor(compat.score)
          }}
        />
      </div>
      <span className="compat-score" style={{ color: getColor(compat.score) }}>
        {compat.score}%
      </span>
    </div>
  );
}

export default CompatibilityBar;
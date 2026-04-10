import { useState, useEffect } from 'react';
import "./TopArtists.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function TopArtists({ userId }) {
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/users/${userId}/top-artists`)
        .then(res => res.json())
        .then(data => setTopArtists(Array.isArray(data) ? data : []));
    }
  }, [userId]);

  if (topArtists.length === 0) return null;

  return (
    <div className="top-artists">
      <h2>Mes top artistes</h2>
      <ul className="artists-list">
        {topArtists.map(artist => (
          <li key={artist.id} className="artist-item">
            {artist.images[0] && <img src={artist.images[0].url} alt={artist.name} />}
            <span>{artist.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TopArtists;
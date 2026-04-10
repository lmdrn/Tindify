import React from 'react';
import './LoginButton.css';

function LoginButton({ type, url, login }) {
  if (login) {
    return (
      <div className="badge-welcome">
        Hello, <strong>{login}</strong> !
      </div>
    );
  }

  const isSpotify = type === 'spotify';
  
  return (
    <a href={url} style={{ textDecoration: 'none' }}>
      <button className={`btn-auth ${isSpotify ? 'btn-spotify' : 'btn-42'}`}>
        {isSpotify ? 'Lier Spotify' : 'Connexion 42'}
      </button>
    </a>
  );
}

export default LoginButton;
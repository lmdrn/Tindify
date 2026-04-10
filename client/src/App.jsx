import { useState, useEffect } from 'react';
import LoginButton from './components/LoginButton/LoginButton';
import UserCard from './components/UserCard/UserCard';
import TopArtists from './components/TopArtists/TopArtists';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = () => {
    fetch(`${API_URL}/users`).then(res => res.json()).then(data => {
      setUsers(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const resolvedToken = token || localStorage.getItem('token');

    if (resolvedToken) {
      if (token) localStorage.setItem('token', resolvedToken);
      fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${resolvedToken}` }
      })
      .then(res => res.json())
      .then(user => {
        setCurrentUser(user);
        window.history.replaceState({}, document.title, "/");
      });
    }
  }, []);

  const handleAddUser = () => {
    const login = prompt("Login :");
    if (login) {
      fetch(`${API_URL}/users/admin/add-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ login, campus: 'Lausanne' })
      }).then(fetchUsers);
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Supprimer ?")) {
      fetch(`${API_URL}/users/admin/delete-user/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      }).then(fetchUsers);
    }
  };

  // UNLINK SPOTIFY
  const handleLogoutSpotify = () => {
    if (!window.confirm("Délier ton compte Spotify ?")) return;

    fetch(`${API_URL}/auth/spotify/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    })
    .then(() => {
      setCurrentUser({ ...currentUser, spotifyId: null });
    });
  };

  // 42 LOGOUT
  const handleLogout42 = () => {
    setCurrentUser(null);
    window.history.replaceState({}, document.title, "/");
  };

  return (
    <div className="app-container">
      <h1 className="text-center">❤️ Tindify ❤️</h1>
      
      <div className="auth-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <LoginButton 
            type="42" 
            url={`${API_URL}/auth/42`} 
            login={currentUser?.login} 
            isAdmin={currentUser?.isAdmin}
          />
          {currentUser && (
            <button onClick={handleLogout42} className="btn-logout-small">logout?</button>
          )}
        </div>
        
        {currentUser && (
          <div style={{ marginTop: '10px' }}>
            {currentUser.spotifyId ? (
              <div className="spotify-status">
                <span>✅ Spotify lié</span>
                <button onClick={handleLogoutSpotify} className="btn-logout-spotify">Délier</button>
              </div>
            ) : (
              <LoginButton 
                type="spotify" 
                url={`${API_URL}/auth/spotify?userId=${localStorage.getItem('token')}`} 
              />
            )}
          </div>
        )}
      </div>

      {currentUser?.isAdmin && (
        <button onClick={handleAddUser} className="btn-add">+ Ajouter un membre</button>
      )}

      {currentUser?.spotifyId && <TopArtists userId={currentUser.id} />}

      <h2>Membres :</h2>
      <ul className="user-list">
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            showDelete={currentUser?.isAdmin && user.id !== currentUser.id}
            onDelete={handleDeleteUser}
            currentUserId={currentUser?.id} 
          />
        ))}
      </ul>
    </div>
  );
}

export default App;
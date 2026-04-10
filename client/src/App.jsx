import { useState, useEffect } from 'react';
import LoginButton from './components/LoginButton/LoginButton';
import UserCard from './components/UserCard/UserCard';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [topArtists, setTopArtists] = useState([]);  // ✅ ici

  const fetchUsers = () => {
    fetch(`${API_URL}/users`).then(res => res.json()).then(data => {
      setUsers(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    
    const resolvedId = userId || localStorage.getItem('userId');
    
    if (resolvedId) {
      if (userId) localStorage.setItem('userId', userId);
      fetch(`${API_URL}/users/${resolvedId}`)
        .then(res => res.json())
        .then(user => {
          setCurrentUser(user);
          window.history.replaceState({}, document.title, "/");
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser?.spotifyId) {
      fetch(`${API_URL}/users/${currentUser.id}/top-artists`)
        .then(res => res.json())
        .then(data => setTopArtists(Array.isArray(data) ? data : []));
    }
  }, [currentUser]);

  const handleAddUser = () => {
    const login = prompt("Login :");
    if (login) {
      fetch(`${API_URL}/users/admin/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, campus: 'Lausanne', adminId: currentUser.id })
      }).then(fetchUsers);
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Supprimer ?")) {
      fetch(`${API_URL}/users/admin/delete-user/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      }).then(fetchUsers);
    }
  };
  console.log("currentUser:", currentUser);
  return (
    <div className="app-container">
      <h1 className="text-center">❤️ Tindify ❤️</h1>
      
      <div className="auth-section">
        <LoginButton 
          type="42" 
          url={`${API_URL}/auth/42`} 
          login={currentUser?.login} 
          isAdmin={currentUser?.isAdmin}
        />
        
        {currentUser && !currentUser.spotifyId && (
          <div style={{ marginTop: '10px' }}>
            <LoginButton 
              type="spotify" 
              url={`${API_URL}/auth/spotify?userId=${currentUser.id}`}
            />
          </div>
        )}
      </div>

      {currentUser?.isAdmin && (
        <button onClick={handleAddUser} className="btn-add">+ Ajouter un membre</button>
      )}

      {topArtists.length > 0 && (
        <div>
          <h2>🎵 Mes top artistes</h2>
          <ul>
            {topArtists.map(artist => (
              <li key={artist.id}>
                {artist.images[0] && <img src={artist.images[0].url} width={50} />}
                {artist.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2>Membres :</h2>
      <ul className="user-list">
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            showDelete={currentUser?.isAdmin && user.id !== currentUser.id}
            onDelete={handleDeleteUser}
          />
        ))}
      </ul>
    </div>
  );
}

export default App;
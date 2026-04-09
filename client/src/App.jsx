import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = () => {
    fetch(`${API_URL}/users`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get('userId');

    if (userIdFromUrl && users.length > 0) {
      const connectedUser = users.find(u => u.id === parseInt(userIdFromUrl));
      if (connectedUser) {
        setCurrentUser(connectedUser);
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, [users]);

  const handleAddUser = () => {
    const login = prompt("Login de l'étudiant :");
    if (!login) return;

    fetch(`${API_URL}/admin/add-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: login, campus: 'Lausanne', adminId: currentUser.id })
    }).then(() => fetchUsers());
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm("Sûr de vouloir le supprimer ?")) return;

    fetch(`${API_URL}/admin/delete-user/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: currentUser.id })
    }).then(() => fetchUsers());
  };

  return (
    <div className="app-container">
      <h1 className="text-center">❤️ Tindify ❤️</h1>
      
      <div className="auth-section">
        {!currentUser ? (
          <a href={`${API_URL}/auth/42`} style={{ textDecoration: 'none' }}>
            <button className="btn-login">
              Se connecter avec 42
            </button>
          </a>
        ) : (
          <div className="badge-connected">
            Connecté en tant que <strong>{currentUser.login}</strong> 
            {currentUser.isAdmin && <span className="badge-admin">[ADMIN]</span>}
          </div>
        )}
      </div>

      {currentUser?.isAdmin && (
        <button onClick={handleAddUser} className="btn-add">
          + Ajouter un membre manuellement
        </button>
      )}

      <h2>Membres de Tindify :</h2>
      <ul className="user-list">
        {users.map(user => (
          <li key={user.id} className="user-item">
            <span><strong>{user.login}</strong> - {user.campus}</span>
            
            {currentUser?.isAdmin && user.id !== currentUser.id && (
              <button onClick={() => handleDeleteUser(user.id)} className="btn-delete">
                ❌
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App;
import { useState, useEffect } from 'react'

function App() {
  const [users, setUsers] = useState([])

  const fetchUsers = () => {
    fetch('http://localhost:3000/users')
      .then(response => response.json())
      .then(data => setUsers(data))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = () => {
    fetch('http://localhost:3000/add-user', { method: 'POST' })
      .then(() => fetchUsers()) 
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Tindify 42</h1>
      <button onClick={handleAddUser} style={{ padding: '10px', fontSize: '16px', cursor: 'pointer', background: '#FF4B4B', color: 'white', border: 'none', borderRadius: '5px' }}>
        Ajouter Loana à la DB
      </button>

      <h2>Membres de Tindify :</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.pseudo}</strong> - Campus {user.campus}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
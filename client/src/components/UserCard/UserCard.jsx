import './UserCard.css';

function UserCard({ user, showDelete, onDelete }) {
  return (
    <li className="user-item">
      <span><strong>{user.login}</strong> — {user.campus}</span>
      {showDelete && (
        <button onClick={() => onDelete(user.id)} className="btn-delete">❌</button>
      )}
    </li>
  );
}

export default UserCard;
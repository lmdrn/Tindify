import CompatibilityBar from '../CompatibilityBar/CompatibilityBar';
import './UserCard.css';

function UserCard({ user, showDelete, onDelete, currentUserId }) {
  const showCompat = currentUserId && user.spotifyId && currentUserId !== user.id;

  return (
    <li className="user-item">
      <div className="user-info">
        <span>🎓 <strong>{user.login}</strong> — {user.campus}</span>
        {showCompat && (
          <CompatibilityBar currentUserId={currentUserId} otherUserId={user.id} />
        )}
      </div>
      {showDelete && (
        <button onClick={() => onDelete(user.id)} className="btn-delete">❌</button>
      )}
    </li>
  );
}

export default UserCard;
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style.css';

interface SidebarProps {
  username: string;
  usernameInput: string;
  setUsernameInput: (v: string) => void;
  signedIn: boolean;
  onSignIn: (e: React.FormEvent) => void;
  onSignOut: () => void;
}

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/', label: 'Chat' },
  { path: '/log', label: 'Log' },
  { path: '/history', label: 'History' },
];

function Sidebar(props: SidebarProps): JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  useEffect(
    function closeDropdownOnClickOutside() {
      function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    },
    [],
  );

  const currentLabel = NAV_ITEMS.find((item) => item.path === location.pathname)?.label ?? 'Chat';

  return (
    <aside className="sidebar">
      <h2>Dextr</h2>
      <div className="sidebar-nav-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className="nav-dropdown-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          {currentLabel}
          <span className="nav-dropdown-chevron">{dropdownOpen ? '▲' : '▼'}</span>
        </button>
        {dropdownOpen && (
          <ul className="nav-dropdown-menu" role="menu">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} role="none">
                <Link
                  to={item.path}
                  role="menuitem"
                  className={location.pathname === item.path ? 'nav-link active' : 'nav-link'}
                  onClick={() => setDropdownOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!props.signedIn ? (
        <form onSubmit={props.onSignIn} className="sign-in-form">
          <input
            type="text"
            placeholder="Enter username"
            value={props.usernameInput}
            onChange={(e) => props.setUsernameInput(e.target.value)}
            autoComplete="username"
          />
          <button type="submit">Sign in</button>
        </form>
      ) : (
        <>
          <p className="username">Signed in as {props.username}</p>
          <button type="button" onClick={props.onSignOut} className="sign-out-btn">
            Sign out
          </button>
        </>
      )}
    </aside>
  );
}

export default Sidebar;

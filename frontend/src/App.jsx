import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { OfferWallPage, WalletPage, ProfilePage, HistoryPage } from './pages';

const links = [
  { to: '/', label: 'Offer Wall', end: true },
  { to: '/wallet', label: 'Wallet' },
  { to: '/profile', label: 'Profile' },
  { to: '/history', label: 'History' }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('rewardAppToken') || '');

  useEffect(() => {
    localStorage.setItem('rewardAppToken', token);
  }, [token]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Reward App</h1>
        <p>UI scaffold for Offer Wall + Wallet workflows</p>
      </header>

      <section className="token-box">
        <label htmlFor="token">Bearer token</label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value.trim())}
          placeholder="Paste JWT from /api/auth/login"
        />
      </section>

      <nav className="tabs" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="page">
        <Routes>
          <Route path="/" element={<OfferWallPage token={token} />} />
          <Route path="/wallet" element={<WalletPage token={token} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

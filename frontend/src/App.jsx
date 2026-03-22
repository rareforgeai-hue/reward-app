import { NavLink, Route, Routes } from 'react-router-dom';
import { OfferWallPage, WalletPage, ProfilePage, HistoryPage } from './pages';

const links = [
  { to: '/', label: 'Offer Wall', end: true },
  { to: '/wallet', label: 'Wallet' },
  { to: '/profile', label: 'Profile' },
  { to: '/history', label: 'History' }
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Reward App</h1>
        <p>Frontend bootstrap for BitLabs reward platform</p>
      </header>

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
          <Route path="/" element={<OfferWallPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

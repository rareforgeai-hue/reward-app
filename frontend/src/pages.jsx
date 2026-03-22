import { useEffect, useMemo, useState } from 'react';
import { fetchOffers, fetchWallet } from './api';

function centsToCurrency(cents = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((Number(cents) || 0) / 100);
}

function Panel({ title, children, action }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function OfferWallPage({ token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (!token) {
      setOffers([]);
      setError('Add a bearer token to load offers.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchOffers(token)
      .then((payload) => {
        if (cancelled) return;
        const raw = payload?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.offers)
            ? raw.offers
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        setOffers(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load offers.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Panel
      title="Offer Wall"
      action={<span className="muted">{offers.length} offers</span>}
    >
      {loading && <p className="muted">Loading offers…</p>}
      {!loading && error && <p className="error">{error}</p>}
      {!loading && !error && offers.length === 0 && <p className="muted">No offers available.</p>}

      <ul className="card-list">
        {offers.map((offer, index) => {
          const id = offer.id ?? offer.offer_id ?? `offer-${index}`;
          const title = offer.title || offer.name || `Offer ${index + 1}`;
          const reward =
            offer.reward ??
            offer.payout ??
            offer.amount ??
            offer.points ??
            offer.value;

          return (
            <li key={id} className="card">
              <div>
                <h3>{title}</h3>
                <p className="muted">{offer.description || 'Complete this offer to earn rewards.'}</p>
              </div>
              <div className="badge">
                {reward !== undefined && reward !== null ? String(reward) : 'Reward N/A'}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function WalletPage({ token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({ balance_cents: 0, recent: [] });

  useEffect(() => {
    if (!token) {
      setWallet({ balance_cents: 0, recent: [] });
      setError('Add a bearer token to load wallet data.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchWallet(token)
      .then((payload) => {
        if (!cancelled) {
          setWallet({
            balance_cents: payload?.balance_cents ?? 0,
            recent: Array.isArray(payload?.recent) ? payload.recent : []
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load wallet.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const earnings = useMemo(
    () => wallet.recent.filter((entry) => Number(entry.amount_cents) > 0).reduce((sum, entry) => sum + Number(entry.amount_cents), 0),
    [wallet.recent]
  );

  return (
    <Panel
      title="Wallet"
      action={<span className="muted">{wallet.recent.length} recent entries</span>}
    >
      {loading && <p className="muted">Loading wallet…</p>}
      {!loading && error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="wallet-metrics">
            <article className="metric">
              <p className="muted">Current Balance</p>
              <strong>{centsToCurrency(wallet.balance_cents)}</strong>
            </article>
            <article className="metric">
              <p className="muted">Total Earned (recent)</p>
              <strong>{centsToCurrency(earnings)}</strong>
            </article>
          </div>

          <h3>Recent Activity</h3>
          {wallet.recent.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            <ul className="card-list compact">
              {wallet.recent.map((entry, idx) => (
                <li key={`${entry.created_at}-${idx}`} className="card">
                  <div>
                    <h4>{entry.type || 'entry'}</h4>
                    <p className="muted">{entry.reference || 'No reference'}</p>
                  </div>
                  <div className="metric-right">
                    <span>{centsToCurrency(entry.amount_cents)}</span>
                    <small className="muted">Bal: {centsToCurrency(entry.balance_after_cents)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}

export function ProfilePage() {
  return (
    <Panel title="Profile">
      <p className="muted">Profile settings UI will be added in upcoming tickets.</p>
    </Panel>
  );
}

export function HistoryPage() {
  return (
    <Panel title="Conversion History">
      <p className="muted">Conversion history UI will be added in upcoming tickets.</p>
    </Panel>
  );
}

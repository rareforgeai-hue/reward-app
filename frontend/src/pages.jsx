function Page({ title, description }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function OfferWallPage() {
  return (
    <Page
      title="Offer Wall"
      description="List available offers and add click-through tracking integration."
    />
  );
}

export function WalletPage() {
  return (
    <Page
      title="Wallet"
      description="Show earnings summary, balance, and payout states."
    />
  );
}

export function ProfilePage() {
  return (
    <Page
      title="Profile"
      description="Manage user profile details and account preferences."
    />
  );
}

export function HistoryPage() {
  return (
    <Page
      title="Conversion History"
      description="Display historical conversion events and statuses."
    />
  );
}

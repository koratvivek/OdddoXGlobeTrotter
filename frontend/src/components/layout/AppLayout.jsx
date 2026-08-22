import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div>
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem',
        }}
      >
        <nav
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <Link to="/" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
            GlobeTrotter
          </Link>
          <Link to="/trips">Trips</Link>
          <Link to="/catalog">Catalog</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/login" style={{ marginLeft: 'auto' }}>
            Login
          </Link>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

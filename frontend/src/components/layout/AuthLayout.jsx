import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            GlobeTrotter
          </Link>
        </div>
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

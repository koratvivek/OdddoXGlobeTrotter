import React from 'react';

export function FormField({ label, htmlFor, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label htmlFor={htmlFor} style={{ fontWeight: 500 }}>
          {label}
        </label>
      )}
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

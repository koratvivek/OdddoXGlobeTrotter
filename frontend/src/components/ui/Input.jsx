import React from 'react';

export function Input({ id, label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label htmlFor={id} style={{ fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          background: 'var(--color-surface)',
        }}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

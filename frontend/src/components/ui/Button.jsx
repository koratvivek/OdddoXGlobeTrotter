import React from 'react';

const baseStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.625rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  cursor: 'pointer',
  fontWeight: 600,
};

const variants = {
  primary: {
  background: 'var(--color-primary)',
  color: '#fff',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    borderColor: 'var(--color-border)',
  },
};

export function Button({ children, variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      style={{ ...baseStyles, ...variants[variant] }}
      {...props}
    >
      {children}
    </button>
  );
}

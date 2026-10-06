import React, { useState } from 'react';

/**
 * ComponentName
 * 
 * @param {Object} props
 * @param {string} props.title - Title displayed in the card header.
 * @param {string} [props.initialStatus='idle'] - Initial state indicator.
 * @param {function} [props.onAction] - Callback fired when the primary action button is clicked.
 * @param {React.ReactNode} [props.children] - Child elements to render inside the body.
 */
export default function ComponentName({
  title,
  initialStatus = 'idle',
  onAction,
  children,
}) {
  // 1. Component State
  const [status, setStatus] = useState(initialStatus);
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Event Handlers
  function handleToggle() {
    setIsExpanded((prev) => !prev);
  }

  function handleActionClick(event) {
    event.stopPropagation();
    setStatus('active');
    if (onAction) {
      onAction();
    }
  }

  // 3. Render Output
  return (
    <article className="component-container" style={styles.card}>
      <header style={styles.header}>
        <h2 style={styles.title}>{title}</h2>
        <span style={styles.badge}>{status}</span>
      </header>

      {/* Conditional Rendering */}
      {isExpanded && (
        <div style={styles.body}>
          {children || <p style={styles.fallback}>No content provided.</p>}
        </div>
      )}

      <footer style={styles.footer}>
        <button type="button" onClick={handleToggle} style={styles.btnSecondary}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
        <button type="button" onClick={handleActionClick} style={styles.btnPrimary}>
          Trigger Action
        </button>
      </footer>
    </article>
  );
}

// 4. Styles Definition (or separate CSS file using className)
const styles = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    margin: '12px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0,
    color: '#0f172a',
  },
  badge: {
    fontSize: '0.75rem',
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  body: {
    padding: '12px 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
  },
  fallback: {
    fontStyle: 'italic',
    color: '#94a3b8',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '12px',
  },
  btnPrimary: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  btnSecondary: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    fontWeight: '500',
  },
};

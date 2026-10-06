import React, { useState } from 'react';

/**
 * Example 1: Basic Component Declaration & Nesting
 * Component names MUST start with an uppercase letter.
 */
function MyButton({ count, onClick }) {
  return (
    <button
      type="button"
      className="btn-counter"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        margin: '4px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        cursor: 'pointer',
      }}
    >
      Clicked {count} times
    </button>
  );
}

/**
 * Example 2: Data Display & Dynamic Styles
 * Demonstrates embedding JS variables and style objects into JSX.
 */
const userProfile = {
  name: 'Hedy Lamarr',
  role: 'Inventor & Actress',
  imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  imageSize: 72,
  isOnline: true,
};

function UserCard({ user }) {
  return (
    <section
      className="profile-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        margin: '12px 0',
      }}
    >
      <img
        src={user.imageUrl}
        alt={`Portrait of ${user.name}`}
        style={{
          width: user.imageSize,
          height: user.imageSize,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
      <div>
        <h3 style={{ margin: 0 }}>{user.name}</h3>
        <p style={{ margin: '4px 0', color: '#64748b' }}>{user.role}</p>
        
        {/* Conditional rendering: Ternary operator */}
        <span
          style={{
            fontSize: '12px',
            color: user.isOnline ? '#16a34a' : '#94a3b8',
            fontWeight: 600,
          }}
        >
          {user.isOnline ? '● Online' : '○ Offline'}
        </span>
      </div>
    </section>
  );
}

/**
 * Example 3: Rendering Lists with Unique Keys
 * Using array.map() to project data into JSX elements.
 */
const initialInventory = [
  { id: 'item-1', title: 'Ergonomic Keyboard', isFruit: false, quantity: 12 },
  { id: 'item-2', title: 'Fresh Apple', isFruit: true, quantity: 0 },
  { id: 'item-3', title: 'Wireless Mouse', isFruit: false, quantity: 5 },
  { id: 'item-4', title: 'Organic Banana', isFruit: true, quantity: 8 },
];

function InventoryList({ items }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            color: item.isFruit ? '#b45309' : '#1e293b',
          }}
        >
          <span>{item.title}</span>
          {/* Conditional rendering: Logical && (safe comparison) */}
          {item.quantity === 0 ? (
            <span style={{ color: '#dc2626', fontSize: '12px' }}>Out of Stock</span>
          ) : (
            <span style={{ fontSize: '12px', color: '#64748b' }}>{item.quantity} in stock</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Example 4: Main Application & Lifting State Up
 * The parent (QuickStartApp) manages the shared state `count`, and passes
 * both `count` and the update handler down to two sibling `MyButton` components.
 */
export default function QuickStartApp() {
  const [sharedCount, setSharedCount] = useState(0);

  function handleIncrement() {
    setSharedCount((prev) => prev + 1);
  }

  function handleReset() {
    setSharedCount(0);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '24px auto', fontFamily: 'sans-serif' }}>
      <h1>React Quick Start Showcase</h1>

      <UserCard user={userProfile} />

      <section style={{ margin: '24px 0' }}>
        <h2>Shared State (Lifting State Up)</h2>
        <p>Both buttons share state from their parent and update synchronously:</p>
        <MyButton count={sharedCount} onClick={handleIncrement} />
        <MyButton count={sharedCount} onClick={handleIncrement} />
        <button
          type="button"
          onClick={handleReset}
          style={{
            marginLeft: '8px',
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset Counters
        </button>
      </section>

      <section style={{ margin: '24px 0' }}>
        <h2>Inventory (Lists & Conditional Rendering)</h2>
        <InventoryList items={initialInventory} />
      </section>
    </div>
  );
}

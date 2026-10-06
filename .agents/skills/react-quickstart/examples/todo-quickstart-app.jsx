import React, { useState } from 'react';

/**
 * Subcomponent: Single Todo Item
 * Receives data and callbacks via props (Unidirectional data flow).
 */
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: todo.completed ? '#f8fafc' : '#ffffff',
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span
          style={{
            textDecoration: todo.completed ? 'line-through' : 'none',
            color: todo.completed ? '#94a3b8' : '#0f172a',
          }}
        >
          {todo.text}
        </span>
      </label>

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        ×
      </button>
    </li>
  );
}

/**
 * Main Component: Complete Interactive Mini-App
 * Demonstrates:
 * 1. useState for controlled inputs and collections.
 * 2. Immutable state operations (Spread, Filter, Map).
 * 3. Conditional rendering (Empty state vs list).
 */
export default function TodoQuickStartApp() {
  const [todos, setTodos] = useState([
    { id: 't-1', text: 'Read React Quick Start documentation', completed: true },
    { id: 't-2', text: 'Understand component nesting and JSX', completed: true },
    { id: 't-3', text: 'Master state and unidirectional data flow', completed: false },
  ]);
  const [inputValue, setInputValue] = useState('');

  // Handle Form Submission
  function handleAddTodo(e) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newTodo = {
      id: `t-${Date.now()}`,
      text: trimmed,
      completed: false,
    };

    // Immutable addition: Array spread
    setTodos((prevTodos) => [...prevTodos, newTodo]);
    setInputValue('');
  }

  // Immutable toggle: Array map
  function handleToggleTodo(id) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  // Immutable deletion: Array filter
  function handleDeleteTodo(id) {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }

  const remainingCount = todos.filter((t) => !t.completed).length;

  return (
    <div style={{ maxWidth: '480px', margin: '32px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2>React Task Tracker</h2>

      <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What needs to be done?"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Add Task
        </button>
      </form>

      {/* Conditional Rendering: Empty State vs Populated List */}
      {todos.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center' }}>No tasks left! Great job.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          ))}
        </ul>
      )}

      {/* Footer Info */}
      <footer style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
        <span>{remainingCount} tasks pending</span>
      </footer>
    </div>
  );
}

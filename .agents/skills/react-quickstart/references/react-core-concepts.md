# React Core Concepts & Official Quick Start Guide Reference

This document encapsulates the fundamental architectural principles and mental models documented in the official [React Documentation (Quick Start - react.dev/learn)](https://react.dev/learn).

---

## 1. Components: Building Blocks of the UI

In React, the User Interface (UI) is composed of individual, reusable, and isolated pieces called **components**.

### Component Declaration Rules
1. **Capitalization**: React component names **must always start with an uppercase letter** (e.g., `MyButton`, `UserProfile`). Lowercase names are reserved for HTML standard elements (`<button>`, `<div>`, `<span>`).
2. **Pure Function Signature**: A component is fundamentally a JavaScript function that receives `props` as its first argument and returns React elements (JSX).
3. **Default vs Named Exports**:
   - `export default function App() {}`: Standard for the primary component of a file.
   - `export function Header() {}`: Ideal for shared component libraries and utilities.

```jsx
// Declaring a component
function MyButton() {
  return (
    <button type="button" className="btn-primary">
      Click me
    </button>
  );
}

// Nesting components
export default function App() {
  return (
    <div>
      <h1>Welcome to my application</h1>
      <MyButton />
    </div>
  );
}
```

---

## 2. Writing Markup with JSX

JSX is a syntax extension for JavaScript that looks similar to HTML, designed to co-locate rendering logic with UI structure.

### The 3 Core Rules of JSX
1. **Single Root Element**: A component cannot return multiple adjacent JSX elements. Wrap them in a shared parent tag or a Fragment (`<>...</>`):
   ```jsx
   // Correct
   return (
     <>
       <h1>Title</h1>
       <p>Description</p>
     </>
   );
   ```
2. **Close All Tags Explicitly**: Self-closing tags must end with `/>` (e.g., `<img />`, `<br />`, `<input />`).
3. **camelCase Property Naming**:
   - `class` becomes `className`.
   - Inline styles use camelCase property names (`backgroundColor` instead of `background-color`).
   - SVG attributes use camelCase (`strokeWidth`, `clipRule`).

---

## 3. Embedding JavaScript Expressions in JSX

Curly braces `{}` act as an "escape hatch" back into JavaScript inside JSX.

### Text Children
```jsx
const user = { name: 'Ada Lovelace', profession: 'Mathematician' };

return <h1>{user.name} - {user.profession}</h1>;
```

### Attributes
Values can be passed dynamically to JSX attributes using `{}` without quotes:
```jsx
<img
  className="avatar-image"
  src={user.avatarUrl}
  alt={`Portrait of ${user.name}`}
/>
```

### Inline Style Objects (`style={{}}`)
Inline styles in JSX require a JavaScript object passed within JSX curly braces:
```jsx
<div
  style={{
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    width: user.imageSize,
  }}
>
  Content
</div>
```

---

## 4. Conditional Rendering

React provides native JavaScript mechanisms for conditionally rendering parts of the UI.

### Technique A: Standard `if / else`
Best for early returns or branching substantial blocks of JSX:
```jsx
function NotificationPanel({ isUnread, message }) {
  if (!isUnread) {
    return <span className="text-muted">No new messages</span>;
  }
  return <div className="alert-badge">{message}</div>;
}
```

### Technique B: Ternary Operator (`condition ? a : b`)
Ideal for inline conditional switching inside JSX expressions:
```jsx
return (
  <div className="status-box">
    {isOnline ? <ActiveBadge /> : <OfflineBadge />}
  </div>
);
```

### Technique C: Logical AND (`&&`) Short-Circuit
Best when rendering something only if a condition is true:
```jsx
return (
  <div>
    <h1>Inbox</h1>
    {unreadCount > 0 && <span className="counter">{unreadCount}</span>}
  </div>
);
```

> **Warning on Logical `&&`**:
> Avoid writing `{items.length && <List />}` because if `items.length` is `0`, JavaScript evaluates the expression to `0`, rendering a literal `0` onto the screen!
> **Safe Pattern**: `{items.length > 0 && <List />}` or `{Boolean(items.length) && <List />}`.

---

## 5. Rendering Lists and Keys

To render an array of items, transform the array into JSX elements using JavaScript's `.map()` method.

```jsx
const products = [
  { id: 'p-1', name: 'Keyboard', inStock: true },
  { id: 'p-2', name: 'Mouse', inStock: false },
  { id: 'p-3', name: 'Monitor', inStock: true },
];

export default function ProductList() {
  return (
    <ul>
      {products.map((product) => (
        <li
          key={product.id}
          style={{ color: product.inStock ? 'green' : 'gray' }}
        >
          {product.name}
        </li>
      ))}
    </ul>
  );
}
```

### Rules of `key`:
1. **Keys must be unique among siblings**: Keys do not need to be globally unique, only unique within the rendered array.
2. **Keys must not change over time**: Never generate keys on the fly during rendering (e.g., `key={Math.random()}`).
3. **Avoid array index as key**: If items are reordered, deleted, or inserted, index keys cause severe state misalignments, input focus glitches, and rendering bugs. Use database IDs or stable unique hashes.

---

## 6. Responding to Events

Event handlers are functions passed as props to elements (e.g., `onClick`, `onChange`, `onSubmit`).

```jsx
function Button() {
  function handleClick(event) {
    event.stopPropagation();
    console.log('Button clicked!');
  }

  return <button onClick={handleClick}>Click here</button>;
}
```

### Crucial Handler Distinction:
- **Pass the function**: `onClick={handleClick}` (Runs on click)
- **Do NOT invoke during render**: `onClick={handleClick()}` (Invokes immediately while rendering, causing infinite re-render loops if state is modified!)
- **Passing parameters**: Use an inline arrow function: `onClick={() => handleDelete(item.id)}`.

---

## 7. State: A Component's Memory

Component props are read-only inputs. When a component needs to store and update data across renders, use **State** via the `useState` hook.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  function increment() {
    setCount(count + 1);
  }

  return (
    <button onClick={increment}>
      Clicked {count} times
    </button>
  );
}
```

### The State Snapshot Model:
- Setting state triggers a re-render.
- During a render, the state variable holds a **snapshot** of the value for that specific render pass.
- Calling `setCount(count + 1)` three times in the same handler will only increment by 1 if using snapshot reference.
- To queue sequential updates based on prior state, use the **functional updater form**:
  ```jsx
  setCount((prevCount) => prevCount + 1);
  ```

---

## 8. Sharing Data: Lifting State Up

When two or more sibling components need to access or modify shared state:
1. **Remove** local state from the child components.
2. **Move** state to their closest common parent component.
3. **Pass** the current state value down as a **prop**.
4. **Pass** an event handler callback down as a **prop** so the child can request state updates.

### Concrete Pattern:
```jsx
import { useState } from 'react';

// Parent manages shared state
export default function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <Panel
        title="About"
        isActive={activeIndex === 0}
        onShow={() => setActiveIndex(0)}
      >
        Welcome to our platform.
      </Panel>
      <Panel
        title="Contact"
        isActive={activeIndex === 1}
        onShow={() => setActiveIndex(1)}
      >
        Reach us at support@example.com.
      </Panel>
    </div>
  );
}

// Child reads props and signals actions
function Panel({ title, isActive, onShow, children }) {
  return (
    <section className="panel-item">
      <h3>{title}</h3>
      {isActive ? (
        <p>{children}</p>
      ) : (
        <button onClick={onShow}>Show</button>
      )}
    </section>
  );
}
```

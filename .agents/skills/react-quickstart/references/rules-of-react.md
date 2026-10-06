# The Invariable Rules of React & State Immutability

Writing robust React applications requires adhering to the fundamental rules enforced by the React engine and compiler.

---

## 1. The Rules of Hooks

Hooks are functions starting with `use` (e.g., `useState`, `useEffect`, `useMemo`, `useCallback`).

1. **Only Call Hooks at the Top Level**:
   - Never call hooks inside loops, conditional statements, nested functions, or `try/catch/finally` blocks.
   - Calling hooks at the top level guarantees that hooks are called in the exact same order on every render, allowing React to preserve internal hook state.
   ```jsx
   // WRONG
   if (isUserLoggedIn) {
     const [profile, setProfile] = useState(null); // VIOLATION
   }

   // CORRECT
   const [profile, setProfile] = useState(null);
   if (!isUserLoggedIn) return <LoginPrompt />;
   ```

2. **Only Call Hooks from React Functions**:
   - Call hooks from React function components.
   - Call hooks from custom hooks (functions whose names begin with `use`).
   - Do NOT call hooks from regular JavaScript functions or utility classes.

---

## 2. Component Purity (Keep Components Pure)

A pure function has two defining properties:
1. **It minds its own business**: It does not change any objects or variables that existed before it was called.
2. **Same inputs, same output**: Given the same props, state, and context, a component must return the exact same JSX.

```jsx
// UNPURE (Anti-pattern)
let guestCount = 0;
function Cup() {
  guestCount = guestCount + 1; // Mutating variable declared outside!
  return <h2>Tea cup for guest #{guestCount}</h2>;
}

// PURE (Correct pattern)
function Cup({ guestNumber }) {
  return <h2>Tea cup for guest #{guestNumber}</h2>;
}
```

### React StrictMode & Double Invocation
In development mode, React renders components **twice** to help surface bugs caused by impure render logic. If a component output changes between the two invocations, it is impure.

---

## 3. Immutability in State Updates

In React, state is treated as **read-only**. Directly mutating state objects or arrays bypasses React's change detection and causes missed re-renders or corrupted state snapshots.

### Updating Objects: Always Create a Copy
```jsx
const [user, setUser] = useState({ name: 'Alex', age: 28, theme: 'dark' });

// WRONG: Mutation
user.age = 29; // React won't know the state changed!

// CORRECT: Object Spread
setUser({
  ...user,
  age: 29
});
```

### Updating Nested Objects
```jsx
const [person, setPerson] = useState({
  name: 'Sam',
  artwork: { title: 'Blue Star', city: 'Tokyo' }
});

// CORRECT: Deep clone the level you want to update
setPerson({
  ...person,
  artwork: {
    ...person.artwork,
    city: 'Kyoto'
  }
});
```

### Updating Arrays in State
Never use mutating methods like `.push()`, `.pop()`, `.splice()`, `.sort()`, or `.reverse()`. Use non-mutating alternatives:

| Action | Mutating (Avoid) | Immutable Alternative (Use) |
| :--- | :--- | :--- |
| **Adding** | `arr.push(item)`, `arr.unshift(item)` | `[...arr, item]`, `[item, ...arr]` |
| **Removing** | `arr.splice(index, 1)`, `arr.pop()` | `arr.filter(item => item.id !== targetId)` |
| **Transforming** | Loop & mutate `arr[i] = val` | `arr.map(item => item.id === targetId ? updatedItem : item)` |
| **Sorting** | `arr.sort()` | `[...arr].sort(...)` |
| **Reversing** | `arr.reverse()` | `[...arr].reverse()` |

---

## 4. Where Does Logic Belong? (Events vs Render)

- **Rendering logic** (the body of the component function):
  - Must remain completely pure.
  - Computes JSX and returns elements.
  - Must NOT trigger network requests, timers, or DOM mutations directly.
- **Event handlers**:
  - Functions nested inside the component (`handleClick`, `handleSubmit`).
  - Allowed to contain side effects (updating state, making API calls, navigating routes).

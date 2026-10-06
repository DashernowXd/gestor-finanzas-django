# React Quick Start Cheat Sheet

A concise reference table covering syntax rules, common patterns, and key React principles.

---

## Syntax Quick Reference

| Feature | Syntax | Key Notes |
| :--- | :--- | :--- |
| **Component** | `function Header({ title }) { return <h1>{title}</h1>; }` | Must start with Capital Letter. Returns JSX. |
| **Fragment** | `<> <ChildA /> <ChildB /> </>` | Avoids adding unnecessary extra DOM nodes. |
| **CSS Class** | `<div className="card active">` | Use `className`, not `class`. |
| **Inline Style** | `<div style={{ margin: 16, color: 'blue' }}>` | Double curlies: outer JSX escaping, inner JS object. |
| **Variables in JSX**| `<h1>Hello, {user.name}!</h1>` | Any valid JS expression evaluates inside `{}`. |
| **Event Handler** | `<button onClick={handleClick}>` | Pass function reference, don't call it `()`! |
| **Event with Args** | `<button onClick={() => handleDelete(id)}>` | Wrap in arrow function to delay execution. |
| **State** | `const [count, setCount] = useState(0);` | Declares reactive state variable + setter. |
| **Updater Form** | `setCount(prev => prev + 1);` | Queues update based on the latest pending state. |
| **Condition (Ternary)** | `{isOpen ? <Modal /> : null}` | Inline conditional branching. |
| **Condition (AND)** | `{count > 0 && <Badge />}` | Always ensure condition evaluates to boolean. |
| **List Mapping** | `items.map(item => <li key={item.id}>{item.name}</li>)` | Unique, stable `key` required on root child element. |

---

## State Mutation Rules Cheat Sheet

```javascript
// Adding to Array
setItems(prev => [...prev, newItem]);

// Removing from Array
setItems(prev => prev.filter(item => item.id !== targetId));

// Updating item in Array
setItems(prev => prev.map(item => item.id === targetId ? { ...item, done: true } : item));

// Updating Object field
setUser(prev => ({ ...prev, email: 'new@example.com' }));
```

---

## Common Gotchas & Fixes

1. **Infinite Re-render Loop**:
   - ❌ `<button onClick={setCount(count + 1)}>`
   - ✅ `<button onClick={() => setCount(count + 1)}>`

2. **Rendered `0` with Logical `&&`**:
   - ❌ `{items.length && <List />}`
   - ✅ `{items.length > 0 && <List />}`

3. **Missing Keys in Loops**:
   - ❌ `{items.map(item => <li>{item.name}</li>)}`
   - ✅ `{items.map(item => <li key={item.id}>{item.name}</li>)}`

4. **Mutating State Directly**:
   - ❌ `items.push(newItem); setItems(items);`
   - ✅ `setItems([...items, newItem]);`

---
name: react-quickstart
description: >-
  Use this skill when developing, structuring, refactoring, or reviewing React components and applications, following official React Quick Start guidelines, JSX rules, props, state management with useState, lifting state up, and list rendering.
---

# React Quick Start — Agent Implementation Runbook

## Overview
This skill guides the design, construction, and refactoring of modern React components and UI applications based on the official [React Quick Start Documentation (react.dev/learn)](https://react.dev/learn). It enforces unidirectional data flow, component purity, immutable state updates, and standard JSX syntax.

## Prerequisites
- Node.js 18+ and npm/yarn/pnpm.
- React 18 or 19 environment (Vite, Next.js, or framework of choice).
- PowerShell 5.1+ / Core (for pattern verification script).

## Directory Structure
- [references/react-core-concepts.md](./references/react-core-concepts.md): In-depth guide to components, JSX, props, conditionals, lists, and lifting state.
- [references/rules-of-react.md](./references/rules-of-react.md): Rules of Hooks, component purity, and state immutability.
- [examples/quickstart-showcase.jsx](./examples/quickstart-showcase.jsx): Canonical implementations from the official Quick Start guide.
- [examples/todo-quickstart-app.jsx](./examples/todo-quickstart-app.jsx): Complete interactive task tracker demonstrating state collections and forms.
- [resources/component-template.jsx](./resources/component-template.jsx): Production-ready boilerplate for functional components.
- [resources/react-cheat-sheet.md](./resources/react-cheat-sheet.md): Fast reference tables for syntax and common patterns.
- [scripts/verify-react-patterns.ps1](./scripts/verify-react-patterns.ps1): Automated scanner for common React anti-patterns.

---

## Step-by-Step Procedure

### 1. Component Architecture & Decomposition
1. **Identify UI Responsibilities**: Break down the visual mockup or requirements into small, focused components (e.g. `Header`, `ProductCard`, `CartBadge`).
2. **Name Components**: Always start component names with a capital letter (`function ItemCard()`, never `function itemCard()`).
3. **Determine Hierarchy**: Establish parent-child relationships and identify which component holds the single source of truth for dynamic data.

### 2. Markup & JSX Implementation
1. **Single Root Element**: Wrap adjacent JSX elements in a shared container tag or React Fragment (`<>...</>`).
2. **Standard HTML vs JSX Attributes**:
   - Replace `class` with `className`.
   - Ensure all void tags are self-closing (`<img />`, `<input />`, `<br />`).
   - Use camelCase for attributes (`strokeWidth`, `tabIndex`).
3. **Dynamic Data & Inline Styles**:
   - Embed JavaScript variables and expressions inside curly braces: `{user.name}`.
   - For dynamic styles, use object literals inside braces: `style={{ backgroundColor: activeColor, padding: 8 }}`.
4. **Conditional Rendering**:
   - Use standard `if/else` for substantial branching or early returns.
   - Use ternary operator `condition ? <A /> : <B />` for inline alternatives.
   - Use logical AND `{condition && <Element />}` only with explicit boolean checks (e.g., `{items.length > 0 && <List />}`).

### 3. Collections & List Rendering
1. **Transform Arrays with `.map()`**:
   ```jsx
   const listItems = products.map((item) => (
     <li key={item.id}>{item.title}</li>
   ));
   ```
2. **Enforce Stable Keys**:
   - Always assign a unique, stable `key` to the outermost element returned by `.map()`.
   - Never use array indices as keys when lists can be reordered, inserted, or filtered.
   - Never generate random keys on render (`key={Math.random()}`).

### 4. State & Event Handling
1. **Event Handlers**:
   - Define handlers inside the component: `function handleClick() { ... }`.
   - Pass the function reference (`onClick={handleClick}`), never call it directly during render (`onClick={handleClick()}`).
   - Pass arguments with arrow functions: `onClick={() => handleDelete(item.id)}`.
2. **Declaring Reactive State**:
   - Use `const [value, setValue] = useState(initialValue);`.
   - Never call `useState` inside conditions, loops, or nested functions (Rules of Hooks).
3. **Immutable Updates**:
   - Objects: `setUser(prev => ({ ...prev, role: 'admin' }))`.
   - Arrays: Use spread `[...arr, newItem]`, `.filter()`, or `.map()`. Never use `.push()`, `.splice()`, or direct index assignment.
   - Use the functional updater form `setCount(prev => prev + 1)` when updates depend on prior state.

### 5. Sharing Data Across Components (Lifting State Up)
1. When two sibling components need synchronized state:
   - Remove state from child components.
   - Move state into their nearest common parent component.
   - Pass the state down to children as props: `<MyButton count={count} />`.
   - Pass a callback function down so children can request state changes: `<MyButton onClick={handleIncrement} />`.

---

## Verification & Validation

1. **Deterministic Code Audit**:
   Execute the verification script across your component files:
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\.agents\skills\react-quickstart\scripts\verify-react-patterns.ps1 -TargetPath "./src"
   ```
2. **Quality Checklist**:
   - [ ] All component names begin with an uppercase letter.
   - [ ] No `class="..."` exists in JSX (replaced with `className="..."`).
   - [ ] All `.map()` calls provide a stable, unique `key` from data (not array index).
   - [ ] No event handlers are invoked immediately on render (e.g. `onClick={fn()}`).
   - [ ] State mutations are strictly immutable (spread, filter, map used instead of push/splice).
   - [ ] Hooks are called unconditionally at the top level of components.

---

## Anti-Patterns & Common Pitfalls

| Anti-Pattern | Why It Breaks | Correct Pattern |
| :--- | :--- | :--- |
| `onClick={handleClick()}` | Executes during render pass; causes infinite re-render loop if state updates. | `onClick={handleClick}` or `onClick={() => handleClick()}` |
| `key={index}` | Causes focus loss, rendering glitches, and state mixups when lists reorder. | `key={item.id}` |
| `state.items.push(x)` | Mutates state directly; React skips re-render because object reference didn't change. | `setItems(prev => [...prev, x])` |
| `{items.length && <List />}` | Evaluates to `0` when empty, rendering a visible "0" on the screen. | `{items.length > 0 && <List />}` |
| Hook inside `if (...)` | Violates Hook execution order guarantees; crashes React state engine. | Call hook at component root; place condition inside render or handlers. |
# Design System: Atelier Finance — Tactile Mineral Minimalism
**Skill:** stitch-design-taste / stitch::generate-design

---

## Configuration — Honest Tactile Minimalism
Tailored for deliberate, non-generic personal finance management. Zero vanity metrics, zero fake testimonials, zero neon lights. Every element is grounded in physical materiality: pressed cotton paper, slate graphite, and muted organic earth pigments.

| Dial | Level | Setting Rationale |
|------|-------|-------------------|
| **Creativity** | `6` | Refined architectural layouts, deliberate asymmetric white space, disciplined typography. |
| **Density** | `6` | Efficient financial ledger layout: balanced and legible without cognitive overload. |
| **Variance** | `7` | Asymmetric split screens, offset balance cards, disciplined grid rhythms. |
| **Motion Intent** | `3` | Restrained, physical-feeling micro-interactions (tactile 1px press). No theatrical animations. |

---

## 1. Visual Theme & Atmosphere
The atmosphere draws inspiration from high-end architectural stationery and Japanese personal ledgers (*Kakebo*). Surfaces evoke matte mineral paper (`#F6F5F1`) and crisp cardstock (`#FFFFFF`), paired with deep graphite ink (`#1C1E21`). The aesthetic is deliberately quiet, disciplined, and functional: no neon glows, no synthetic gradients, and no digital noise.

---

## 2. Color Palette & Functional Roles
- **Mineral Chalk Canvas** (`#F6F5F1`) — Primary background canvas. Warm, matte paper tone.
- **Cardstock Surface** (`#FFFFFF`) — Elevated panels, form surfaces, and ledger containers.
- **Deep Graphite Ink** (`#1C1E21`) — Primary text and structural borders. Crisp, high contrast, never pure black.
- **Muted Stone Slate** (`#686E78`) — Secondary text, category tags, ledger notes, and field labels.
- **Paper Hairline Border** (`rgba(28, 30, 33, 0.12)`) — 1px crisp architectural dividing lines.
- **Sage Forest Accent** (`#2B5440`) — Primary functional accent (monto de ingresos, botón principal, balance positivo). Saturation 42%, zero glow.
- **Muted Terracotta** (`#9E4535`) — Secondary functional indicator (monto de gastos). Matte earthy pigment, zero fluorescent red.

### Banned Color Clichés
- NO neon glows, cyan/violet radioactive lights, or artificial "cyberpunk" gradients.
- NO pure black (`#000000`).
- NO high-saturation alerts (> 60% saturation).

---

## 3. Typographic Architecture
- **Display / Headlines:** `Satoshi` or `Cabinet Grotesk` (Weight 700, tracking `-0.03em`). Sober, commanding, tight leading (`1.15`).
- **Body & Controls:** `Satoshi` (Weight 400 & 500, leading `1.5`, max line length 65ch).
- **Ledger Figures & Currency:** `JetBrains Mono` (Weight 500 & 600, tabular numeric alignment `tnum`). All monetary values (`$1,250.00`) and dates (`2026-10-06`) use monospace for alignment.

### Banned Typography
- NO `Inter` font.
- NO generic default serifs (`Times New Roman`, `Georgia`).
- NO oversized decorative script fonts.

---

## 4. Component Behaviors & Materiality
* **Buttons:**
  - *Primary:* Solid Deep Graphite (`#1C1E21`), text `#FFFFFF`, 6px subtle radius (`rounded-md`). Tactile `-1px translateY` on `:active`. Zero shadow glow.
  - *Secondary / Outline:* Background `#FFFFFF`, border `1px solid rgba(28, 30, 33, 0.2)`, text `#1C1E21`.
* **Ledger Cards & Modules:**
  - Crisp 1px hairline border in `rgba(28, 30, 33, 0.12)`.
  - Radius: `8px` to `12px` (`rounded-lg`). Flat surface with faint tactile shadow (`0 2px 6px rgba(0,0,0,0.03)`).
* **Inputs & Transaction Form:**
  - Label positioned cleanly above in `Muted Stone Slate` with small tracking.
  - Background `#FFFFFF` with `1px solid rgba(28, 30, 33, 0.18)` border. On focus: sharp graphite border (`#1C1E21`), no fuzzy blue aura.
* **Category Badges:**
  - Minimal pill tags (`Alimentos`, `Servicios`, `Ocio`, `Salario`) with soft tinted background (`rgba(0,0,0,0.04)`) and dark text.

---

## 5. Strict Content Bans (Anti-Slop Directives)
- **NO FAKE METRICS:** No "99.9% savings", no "10,000+ active users", no artificial percentage indicators.
- **NO TESTIMONIALS OR REVIEWS:** Zero fabricated quotes, zero fake profile photos, zero 5-star badges.
- **NO NEON OR LIGHT RAYS:** No floating neon halos, no background glowing blobs, no glassmorphism specular highlights.
- **NO OVERLAPPING CONTENT:** Text and images never collide. Strict spatial geometry.
- **NO FILLER COPY:** No "Empower your future", "Elevate your wealth", or "Seamless next-gen experience". Clear, direct language only.

---

## 6. Page Specifications

### Screen A: Landing Page (Honest Minimalism)
- **Navigation:** Minimalist header with logomark ("ATELIER / FINANCES"), links to "Método", "Categorías", and single CTA "Iniciar Sesión / Registrarse".
- **Hero Section (Asymmetric Split):**
  - Left column: Direct headline ("Claridad financiera sin artificios."), manifesto on why tracking categories (Alimentos, Servicios, Ocio, Salario) delivers true solvency, and single primary CTA button ("Comenzar mi registro").
  - Right column: Clean interactive ledger card preview showing live calculations of income, expenses, and net balance with real category breakdowns.
- **Core Principles Section:** 3-column asymmetric layout detailing the 3 fundamental tenets:
  1. *Aislamiento estricto por usuario y privacidad.*
  2. *Cálculo directo en base de datos con precisión decimal.*
  3. *Control consciente por categorías esenciales.*
- **Minimalist Footer:** Navigation links, status indicators, and copyright.

### Screen B: Operational Dashboard (High Efficiency)
- **Header Bar:** Profile badge, current period selector (Mes en curso), quick-action button "+ Nueva Transacción".
- **Balance Overview Strip (3 Columns):**
  - Total Ingresos (`Sage Forest` text with + symbol, monospace numbers).
  - Total Gastos (`Muted Terracotta` text with - symbol, monospace numbers).
  - Balance Neto Disponible (Deep Graphite, bold monospace figure).
- **Main Operational Grid (Asymmetric 8/4 Split):**
  - *Left Area (8 cols):* Transacciones Recientes en formato libro contable (Fecha, Descripción, Categoría con badge, Monto, Tipo). Buscador y filtros rápidos por categoría y rango de fechas.
  - *Right Area (4 cols):* 
    - Desglose presupuestario por categoría con barras de progreso sobrias (Alimentos, Servicios, Ocio, Salario).
    - Módulo de registro rápido de transacción con validación en tiempo real.

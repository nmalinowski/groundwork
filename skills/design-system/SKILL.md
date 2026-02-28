---
name: design-system
description: This skill should be used when establishing a design system - foundations, brand identity, and UX patterns in one workflow
user-invocable: false
---

# Design System Skill

Establishes a complete design system through guided collaboration: foundations, brand identity, and UX patterns.

## Collaboration Approach

- **Lead with recommendations** - "I recommend X because [your context]"
- **Minimize questions** - Most context is in PRD/architecture
- **Iterate on feedback** - Adjust specific elements, don't restart
- **Accept user direction** - If user has specific preferences, incorporate them
- **Use AskUserQuestion tool** - When asking the user questions, always use the AskUserQuestion tool with appropriate options

When user doesn't have a preference:
> "I'll go with [X] because [reason]. I can adjust later if needed."

Document and move on.

## File Locations

- **Input:**
  - `specs/product_specs.md` (PRD with personas, vision, NFRs)
  - `specs/architecture.md` (technical constraints, API patterns)
- **Output:** `specs/design_system.md`
- **Transient:** `specs/design-comparison.html` (color/font comparison, deleted after identity is chosen)

## Prerequisites

Check for PRD first. If `specs/product_specs.md` doesn't exist, prompt user to run `/product-design` first.

Architecture file is optional but helpful for UX pattern decisions.

---

## Phase 1: Foundations

### Step 1: Context Gathering

Extract design-relevant context from PRD + a few targeted questions.

**From PRD (already available):**
- Personas -> accessibility needs, expertise level
- Product vision -> personality keywords
- NFRs -> any explicit accessibility requirements

**Targeted Questions (only what's missing):**

> "Before we define the design system, a few quick questions:
> 1. Do you have existing brand colors/fonts, or starting fresh?
> 2. Any specific accessibility requirements? (WCAG level, legal compliance)
> 3. Is this mobile-first, desktop-first, or balanced?"

Move on quickly after gathering constraints.

### Step 2: Propose Design Principles

Based on context, propose principles and explain why.

> "Based on [specific context from PRD], I recommend these guiding principles:
>
> **DP-001: Clarity First**
> Your [persona] users need to make quick decisions - clarity beats cleverness.
>
> **DP-002: [Principle Name]**
> Because [specific reason tied to their context].
>
> **DP-003: [Principle Name]**
> This supports [their stated goal/constraint].
>
> Does this direction feel right? I can adjust if something's off."

**Handle Feedback:**
- User agrees -> Document and proceed to Phase 2
- User pushes back -> Adjust specific principle, don't restart

### Step 3: Establish Tokens

Define foundational token categories without waiting for approval on each:

**Spacing Scale (4px base):**
- `--space-1`: 4px through `--space-16`: 64px

**Elevation Scale:**
- `--elevation-0` (flat) through `--elevation-3` (modals)

**Border Radius:**
- `--radius-none` (0) through `--radius-full` (pills)

Present as a cohesive system. Only adjust if user has concerns.

---

## Phase 2: Brand Identity

### Step 4: Propose Identity Options

Propose 2-4 complete visual identity options, each pairing a color palette with a font choice that suits its personality. Draw from the product context, personas, and design principles.

> "Based on [context], here are identity options to compare:
>
> **Option A: [Name] — [Personality tag]**
> Colors: Primary [hex], Secondary [hex], Accent [hex]
> Fonts: [Heading font] / [Body font]
> Personality: [1-sentence description]
>
> **Option B: [Name] — [Personality tag]**
> Colors: Primary [hex], Secondary [hex], Accent [hex]
> Fonts: [Heading font] / [Body font]
> Personality: [1-sentence description]
>
> **Option C: [Name] — [Personality tag]** *(if warranted)*
> ...
>
> I'll generate a visual comparison so you can see these side-by-side in your browser."

**Handle Feedback:**
- User has specific colors/fonts → Incorporate as an additional candidate
- User eliminates options → Note preferences, carry forward survivors
- User wants different direction → Propose new candidates

Aim for 2-4 candidates total (avoids decision fatigue). Include user-provided colors/fonts as a candidate if offered.

### Step 5: Generate Visual Comparison

Generate `specs/design-comparison.html` — a self-contained file that renders identical UI components under each candidate identity option, side-by-side, with a decision helper table.

**Architecture — data-driven, single render function:**

1. **CSS custom properties per scheme** — each scheme defines color variables (`--bg-primary`, `--bg-secondary`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--accent`, `--accent-hover`, `--accent-fg`, `--glass`, `--glass-border`, `--success`, `--success-muted`, `--focus-ring`) AND font overrides (`--font-heading`, `--font-body`).

2. **JavaScript scheme array** — each entry contains:
   - `id`, `name`, `subtitle` (short description)
   - `bgHex`, `accentHex`, `textHex` (for contrast computation)
   - `vars` object mapping CSS custom properties to values
   - `fonts` object with `heading` and `body` font-family strings
   - `mood` array of personality tags
   - `audience`, `personality` descriptions

3. **Single `renderColumn(scheme)` function** — generates identical components per scheme:
   - Navigation bar with logo mark, nav links, avatar
   - Button row (primary, outline, ghost)
   - Glass card with heading, body text, badge
   - Form input with label and placeholder
   - Badge row (default, success, outline)
   - Progress bar with label
   - Content card with image placeholder, title, actions

4. **Decision helper table** at the bottom with computed rows:
   - Base colors (swatches + hex codes)
   - Text-on-background WCAG contrast ratio (computed, with AA pass/fail badge)
   - Accent-on-background WCAG contrast ratio (computed, with AA pass/fail badge)
   - Mood tags
   - Audience fit
   - Font pairing (heading + body font names)

5. **Self-contained** — no external dependencies except Google Fonts `<link>` tags for candidate fonts. All CSS and JS inline.

6. **Responsive grid** — columns per scheme count (`cols-2`, `cols-3`, `cols-4`) with responsive breakpoints.

**Font loading:** Add a single `<link>` to Google Fonts loading all candidate heading and body fonts. Apply per-scheme via `--font-heading` / `--font-body` CSS custom properties and a `.has-custom-fonts` class on each scheme column.

**WCAG contrast computation:** Include `hexToRgb()`, `srgbToLinear()`, `luminance()`, and `contrastRatio()` functions inline. Display results as `N.N:1 AA Pass` (green) or `N.N:1 AA Fail` (red).

**After generating:**

> "I've generated the visual comparison at `specs/design-comparison.html`. Open it in your browser to see the identity options side-by-side."

**Handle evaluation feedback:**
- User picks a winner → Document as BRD decisions, define semantic colors and type scale, proceed to Step 6
- User wants tweaks → Regenerate with adjustments
- User likes colors from one option + fonts from another → Regenerate a mixed comparison
- User can't decide → Generate a focused 2-scheme comparison

**After identity is chosen, define the full palette and type scale:**

Semantic colors (propose based on chosen palette temperature):

| Semantic | Color | Usage |
|----------|-------|-------|
| Success | Green | Confirmations, completed states |
| Warning | Amber | Cautions, pending actions |
| Error | Red | Errors, destructive actions |
| Info | Blue | Informational messages |

Neutral palette: Define gray scale for text, backgrounds, borders based on chosen primary color temperature.

Type scale based on chosen body font:

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 12px | Captions, labels |
| `--text-sm` | 14px | Secondary text |
| `--text-base` | 16px | Body text |
| `--text-lg` | 18px | Lead paragraphs |
| `--text-xl` | 20px | Section headers |
| `--text-2xl` | 24px | Page headers |
| `--text-3xl` | 30px | Hero text |

Delete `specs/design-comparison.html` after the palette and typography are documented.

### Step 6: Brand Voice

> "For UI copy, I recommend this voice:
>
> **Tone:** [Professional but approachable] - matches [persona] expectations
> **Style:** [Concise, action-oriented] - supports [DP-001: Clarity First]
>
> Example error: 'We couldn't save your changes. Try again?'
> Example empty state: 'No projects yet. Create your first one.'
> Example success: 'Changes saved'
>
> Does this tone feel right?"

---

## Phase 3: UX Patterns

### Step 7: Recommend Patterns as a System

Derive from architecture + PRD (minimal questions needed).

> "Based on your architecture and product needs, here's the UX pattern system:
>
> **Navigation: Sidebar with collapsible sections**
> You have [N] top-level features. Sidebar keeps everything accessible.
>
> **Loading: Skeleton screens + optimistic updates**
> Your API is fast. Skeletons for initial loads, optimistic for writes.
>
> **Errors: Layered approach**
> - Inline for field validation
> - Toast for operation failures
> - Banner for system issues
>
> **Empty States: Illustrated with clear CTA**
> First-run guides users; no-data encourages action.
>
> **Forms: Validate on blur**
> Catches issues early without being intrusive.
>
> **Responsive: Mobile-first breakpoints**
> Standard Tailwind scale (sm/md/lg/xl).
>
> **Motion: Purposeful and quick**
> - Micro-interactions: 100-200ms
> - Transitions: 200-300ms
> - Respect `prefers-reduced-motion`
>
> This is a cohesive system. Any patterns you want me to reconsider?"

**Handle Feedback:**
- User agrees -> Document all as UXD-001 through UXD-00N
- User questions one -> Explain reasoning, adjust if needed

---

## Step 8: Document Design System

Create `specs/design_system.md` using template in `references/design-system-template.md`.

Populate all sections:
1. **Foundations** - DP-NNN principles, accessibility level, tokens
2. **Brand Identity** - Colors, typography, voice
3. **UX Patterns** - Navigation, loading, errors, forms, responsive, motion
4. **Decision Log** - All decisions with context and rationale

Present summary for review, then write the file.

> "Here's the complete design system:
>
> **Foundations:** [N] design principles, WCAG [level], token system
> **Brand:** [Primary color], [Font], [Voice tone]
> **UX Patterns:** [Nav type], [Loading strategy], [Error approach]
>
> Ready to document this in `specs/design_system.md`?"

## Step 9: Suggest Next Step

After successfully writing the design system document, ask what should be the next workflow step:

```json
{
  "questions": [{
    "question": "What would you like to do next?",
    "header": "Next step",
    "options": [
      {
        "label": "Design architecture",
        "description": "Translate these requirements into technical architecture decisions"
      },
      {
        "label": "Create tasks",
        "description": "Break product/architecture/UX down into tasks"
      }
    ],
    "multiSelect": false
  }]
}
```

**Handle the response:**

- **Design architecture**: Invoke the `groundwork:architecture` skill to design the technical approach
- **Create tasks**: Invoke the `groundwork:tasks` skill to create a list of executable tasks

---

## Decision Record Format

Each decision follows a lightweight format:

```markdown
### [PREFIX]-NNN: [Decision Title]

**Status:** Accepted
**Date:** YYYY-MM-DD
**Context:** [Why this matters for this product]

**Decision:** [What was decided]

**Rationale:** [Why, referencing context or other decisions]
```

**Prefixes:**
- `DP-NNN` - Design Principles
- `BRD-NNN` - Brand Identity decisions
- `UXD-NNN` - UX Pattern decisions

---

## Reference Files

- `references/design-system-template.md` - Template for design system document
- `references/color-examples.md` - Example color palettes by industry
- `references/typography-examples.md` - Example type systems
- `references/pattern-examples.md` - Example UX patterns

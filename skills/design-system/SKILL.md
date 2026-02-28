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

## Design Philosophy

Every design system should have a **distinctive identity**, not just be functional. The goal is a system that someone could recognize — "that's [product name]" — from its visual identity alone.

**Anti-generic principle:** Never default to the most common choices just because they're safe. If you find yourself reaching for Inter + enterprise blue + clean minimal, stop and ask why. Those choices should require justification, not be the path of least resistance.

**Tonal direction:** Every design system should commit to a recognizable aesthetic posture — not a vague descriptor like "professional" or "modern" (which describe everything and nothing), but a specific tonal direction:

- Brutally minimal, maximalist, retro-futuristic, organic warmth, quiet luxury, playful, editorial, brutalist, art deco, soft atmospheric, industrial, geometric bold

The tonal direction is derived from the product's persona, vision, and competitive context. It guides every downstream decision — color strategy, typography personality, spatial character, motion style.

**Memorability test:** After defining the identity, ask: "Would a user recognize this product from its visual identity alone?" If swapping the logo onto a competitor's site would go unnoticed, the identity isn't distinctive enough.

**Distinctiveness and accessibility are not in tension.** Bold color choices can meet WCAG AA. Characterful typography can be highly readable. Atmospheric surfaces can have clear contrast. Never trade accessibility for aesthetics — find the intersection.

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

Based on context, propose principles and explain why. One principle should address **visual identity and aesthetic commitment** — not as decoration, but as a functional design value.

Also derive a **tonal direction** from the PRD's persona and vision. Avoid vague non-directions like "professional", "modern", or "clean" — these describe nearly every product and guide no decisions. Instead, commit to a specific aesthetic posture (see the tonal direction list in Design Philosophy above).

> "Based on [specific context from PRD], I recommend these guiding principles:
>
> **DP-001: Clarity First**
> Your [persona] users need to make quick decisions - clarity beats cleverness.
>
> **DP-002: [Principle Name]**
> Because [specific reason tied to their context].
>
> **DP-003: Distinctive Identity**
> [Product] should be visually recognizable — its personality should come through in every screen, not just the marketing site. This means committing to [tonal direction] as our aesthetic posture.
>
> **Tonal Direction: [specific direction]**
> Derived from [persona characteristic] and [product vision element]. This will guide our color strategy, typography choices, spatial feel, and motion character.
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

Before proposing options, confirm the **tonal direction** established in Step 2. Each option should be a genuine exploration of that direction (or a deliberate contrast if offering range), not a convergence on "clean professional minimal."

Propose 2-4 complete visual identity options, each pairing a color strategy with typography that suits its personality. Draw from the product context, personas, and design principles.

**Anti-pattern warnings:**
- Do not propose options where all use the same font family
- Do not copy palettes from famous brands (see "Colors to Avoid as Primary" in color reference)
- Do not let all options converge on the same personality — if they all feel "clean and minimal," the exercise failed
- At least one option should use a characterful or unexpected font pairing

> "Based on [context] and our **[tonal direction]** direction, here are identity options to compare:
>
> **Option A: [Name] — [Personality tag]**
> **Tonal Direction:** [specific direction this option embodies]
> Colors: Primary [hex], Secondary [hex], Accent [hex]
> Color Strategy: [e.g., Dominant + Sharp Accent, Monochrome + One]
> Fonts: [Heading font] / [Body font]
> **Visual Atmosphere:** [texture/surface concept — e.g., "subtle grain texture on surfaces, sharp card shadows"]
> **Spatial Character:** [layout personality — e.g., "generous whitespace, asymmetric hero layouts"]
> Personality: [1-sentence description]
>
> **Option B: [Name] — [Personality tag]**
> **Tonal Direction:** [specific direction]
> Colors: Primary [hex], Secondary [hex], Accent [hex]
> Color Strategy: [approach]
> Fonts: [Heading font] / [Body font]
> **Visual Atmosphere:** [different texture/surface concept]
> **Spatial Character:** [different layout personality]
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
   - `atmosphere` — a brief description of the visual texture/surface feel (e.g., "subtle grain texture, sharp shadows")
   - `spatialCharacter` — the layout personality (e.g., "generous whitespace, centered compositions")

3. **Single `renderColumn(scheme)` function** — generates identical components per scheme:
   - Navigation bar with logo mark, nav links, avatar
   - Button row (primary, outline, ghost)
   - Glass card with heading, body text, badge
   - Form input with label and placeholder
   - Badge row (default, success, outline)
   - Progress bar with label
   - Content card with image placeholder, title, actions
   - Apply a subtle background texture or overlay per scheme (e.g., noise, gradient wash, grain) based on `scheme.atmosphere` to give each column a different *feel*, not just different colors

4. **Decision helper table** at the bottom with computed rows:
   - Base colors (swatches + hex codes)
   - Text-on-background WCAG contrast ratio (computed, with AA pass/fail badge)
   - Accent-on-background WCAG contrast ratio (computed, with AA pass/fail badge)
   - Mood tags
   - Audience fit
   - Font pairing (heading + body font names)
   - Atmosphere (visual texture/surface description)
   - Spatial character (layout personality)

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

> "Based on your architecture, product needs, and our **[tonal direction]** direction, here's the UX pattern system:
>
> **Navigation: [Pattern] — [why]**
> [Specific recommendation tied to feature count and product type.]
>
> **Loading: [Pattern] — [why]**
> [Specific recommendation tied to API characteristics.]
>
> **Errors: Layered approach**
> - Inline for field validation
> - Toast for operation failures
> - Banner for system issues
>
> **Empty States: [Pattern] — [why]**
> [Specific recommendation tied to first-run experience needs.]
>
> **Forms: [Pattern] — [why]**
> [Specific recommendation tied to user expertise level.]
>
> **Responsive: [Pattern] — [why]**
> [Specific recommendation tied to primary device context.]
>
> **Visual Atmosphere:**
> - **Background textures:** [e.g., subtle noise on surfaces, gradient washes on hero sections, solid flat for data areas]
> - **Card treatments:** [e.g., glass morphism with blur, sharp drop shadows, flat with border, soft elevation]
> - **Section dividers:** [e.g., hairline rules, gradient fades, whitespace only, decorative accent lines]
> - **Image treatments:** [e.g., rounded corners with shadow, duotone filter, masked into shapes, full-bleed]
>
> **Spatial Composition:**
> - **Alignment style:** [e.g., strict 12-column grid, organic offset, centered single-column, asymmetric split]
> - **Density:** [e.g., generous whitespace letting content breathe, compact utilitarian, varied rhythm by section type]
> - **Hero treatments:** [e.g., full-bleed imagery, typographic-only, split layout with illustration, contained card]
> - **Content rhythm:** [e.g., regular cadence with consistent section heights, varied sizes creating visual interest, alternating layouts]
>
> **Motion & Interaction Character:**
> - **Entrance patterns:** [e.g., fade-up with stagger, instant cut, slide from direction of origin]
> - **Hover signatures:** [e.g., subtle lift + shadow deepen on cards, color shift on buttons, underline slide on links]
> - **Scroll behavior:** [e.g., sticky section headers, gentle parallax on hero, reveal-on-scroll for content sections]
> - **Timing:** Micro-interactions 100-200ms, transitions 200-300ms
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
> **Tonal Direction:** [specific direction — e.g., warm editorial, brutally minimal]
> **Visual Atmosphere:** [surface/texture summary — e.g., subtle grain textures, glass cards, generous whitespace]
> **UX Patterns:** [Nav type], [Loading strategy], [Error approach], [Motion character]
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
- `references/color-examples.md` - Color strategy approaches and reference palettes
- `references/typography-examples.md` - Example type systems
- `references/pattern-examples.md` - Example UX patterns

# Color Strategy Reference

Reference palettes organized by structural approach — not by industry defaults.

## Color Strategy Approaches

Choose a palette structure based on the product's tonal direction, not its industry category.

### 1. Dominant + Sharp Accent (80/15/5)

A single dominant hue occupies most of the visual space. A sharp accent — contrasting in hue or saturation — draws attention to key actions.

**Principle:** Restraint creates focus. The accent earns attention because it's rare.

**Example A — Deep Forest + Coral:**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #1B4332 | Backgrounds, nav, headers |
| Neutral | #D8D5C8 | Surfaces, cards, body |
| Accent | #E76F51 | CTAs, alerts, active states |

**Example B — Charcoal + Electric Lime:**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #2B2D42 | Backgrounds, structure |
| Neutral | #EDF2F4 | Surfaces, content areas |
| Accent | #C5F32A | Primary actions, highlights |

**Suits:** Brutally minimal, quiet luxury, editorial, industrial

### 2. Tonal Range (Single Hue, Wide Lightness)

One hue explored across a wide range of lightness and saturation. Creates cohesion while allowing hierarchy through shade variation.

**Principle:** Unity through restraint. Depth comes from lightness, not hue variety.

**Example A — Indigo Range:**
| Role | Hex | Usage |
|------|-----|-------|
| Deep | #312E81 | Headers, primary actions |
| Mid | #6366F1 | Active states, links |
| Light | #E0E7FF | Backgrounds, hover states |

**Example B — Warm Terracotta Range:**
| Role | Hex | Usage |
|------|-----|-------|
| Deep | #7C2D12 | Headlines, emphasis |
| Mid | #C2410C | Actions, interactive elements |
| Light | #FFF7ED | Backgrounds, surfaces |

**Suits:** Organic warmth, soft atmospheric, quiet luxury, art deco

### 3. Complementary Tension (Opposite Hues)

Two hues from opposite sides of the color wheel create visual energy and contrast. Requires careful balancing — one dominant, one supporting.

**Principle:** Tension creates energy. Use asymmetric proportions to keep it controlled.

**Example A — Navy + Amber:**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #1E3A5F | Structure, headers, navigation |
| Complement | #F59E0B | Actions, highlights, accents |
| Neutral | #F8FAFC | Backgrounds, content |

**Example B — Teal + Warm Rose:**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #115E59 | Headers, anchoring elements |
| Complement | #E11D48 | Actions, alerts, emphasis |
| Neutral | #F0FDFA | Backgrounds, surfaces |

**Suits:** Playful, geometric bold, retro-futuristic, editorial

### 4. Analogous Warmth / Cool (Adjacent Hues)

Two or three adjacent hues on the color wheel create a harmonious, temperature-consistent palette. Feels natural and cohesive.

**Example A — Warm Analogous (Amber → Rose):**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #B45309 | Headers, primary brand |
| Secondary | #BE185D | Secondary actions, links |
| Neutral | #FFFBEB | Backgrounds, surfaces |

**Example B — Cool Analogous (Cyan → Violet):**
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #0891B2 | Primary brand, navigation |
| Secondary | #7C3AED | Secondary actions, accents |
| Neutral | #F0F9FF | Backgrounds, surfaces |

**Suits:** Organic warmth, soft atmospheric, playful, art deco

### 5. Monochrome + One (Grayscale + Single Expressive Color)

The entire UI is built in grayscale. A single chromatic color carries all the emotional weight — making it intensely recognizable.

**Principle:** Maximum restraint makes the single color unforgettable. The color becomes synonymous with the brand.

**Example A — Cool Gray + Signal Red:**
| Role | Hex | Usage |
|------|-----|-------|
| Surface | #18181B | Primary background |
| Content | #FAFAFA | Text, borders |
| Signal | #DC2626 | Actions, emphasis, brand mark |

**Example B — Warm Stone + Forest:**
| Role | Hex | Usage |
|------|-----|-------|
| Surface | #FAFAF9 | Primary background |
| Content | #292524 | Text, structure |
| Signal | #15803D | Actions, success, brand mark |

**Suits:** Brutally minimal, brutalist, industrial, quiet luxury

## Colors to Avoid as Primary

These colors are so widely associated with specific products that using them risks looking derivative:

| Color | Hex Range | Why Avoid |
|-------|-----------|-----------|
| Enterprise Blue | #1E40AF – #2563EB | Reads as "generic SaaS" (Salesforce, LinkedIn, countless others) |
| Dev-tool Purple | #7C3AED – #8B5CF6 | Reads as "trying to be Linear/Vercel/GitHub" |
| Stripe Gradient Purple-Blue | #635BFF → #0A2540 | Instantly recognizable as Stripe |
| Slack Aubergine | #4A154B | Strongly owned by Slack |
| Spotify Green | #1DB954 | Strongly owned by Spotify |

This doesn't mean you can never use blue or purple — but shift the hue, saturation, or temperature enough to create distance. A dusty slate-blue (#475569) reads differently from enterprise blue. A warm plum (#7E22CE shifted warm) reads differently from dev-tool purple.

## Finding Distinctive Colors

1. **Start from tonal direction, not industry.** "Warm editorial" or "brutally minimal" gives you a color temperature and saturation range before you pick a single hue.

2. **Use HSL thinking.** Adjusting saturation and lightness within a hue creates distinctiveness faster than picking a new hue entirely. A muted, desaturated teal (#0F766E at S:40%) feels completely different from a vivid teal (#0D9488 at S:80%).

3. **Test against competitors.** Screenshot three direct competitors. Place your palette next to them. If they could swap palettes without anyone noticing, yours isn't distinctive enough.

4. **Consider undertones.** A yellow-leaning green (#84CC16) has a completely different personality from a blue-leaning green (#059669). Undertones carry more emotional weight than the base hue.

5. **Dark mode reveals character.** A palette that looks distinctive in light mode but generic in dark mode wasn't distinctive — it was relying on white space. Test both.

## Semantic Color Standards

Regardless of brand, semantic colors should be consistent:

| Semantic | Standard Range | Notes |
|----------|----------------|-------|
| Success | Green 500-600 | #22C55E - #16A34A |
| Warning | Amber 400-500 | #FBBF24 - #F59E0B |
| Error | Red 500-600 | #EF4444 - #DC2626 |
| Info | Blue 400-500 | #60A5FA - #3B82F6 |

## Dark Mode Considerations

When designing for dark mode:

1. **Don't invert brand colors** - Adjust saturation/brightness instead
2. **Reduce vibrancy** - Overly saturated colors strain eyes in dark mode
3. **Flip semantics carefully** - Error red should still read as error
4. **Watch elevation** - Shadows don't work; use subtle lightening instead

### Dark Mode Neutral Scale

| Light Mode | Dark Mode |
|------------|-----------|
| White (#FFFFFF) | Zinc 900 (#18181B) |
| Gray 50 (#F9FAFB) | Zinc 800 (#27272A) |
| Gray 100 (#F3F4F6) | Zinc 700 (#3F3F46) |
| Gray 900 (#111827) | Zinc 50 (#FAFAFA) |

## Contrast Checking

Always verify contrast ratios:

| WCAG Level | Normal Text | Large Text | UI Components |
|------------|-------------|------------|---------------|
| AA | 4.5:1 | 3:1 | 3:1 |
| AAA | 7:1 | 4.5:1 | 4.5:1 |

**Tools:**
- WebAIM Contrast Checker
- Figma Stark plugin
- Chrome DevTools color picker

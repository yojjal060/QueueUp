---
name: QueueUp Design System
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3b3937'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1d1b1a'
  surface-container: '#211f1e'
  surface-container-high: '#2b2a28'
  surface-container-highest: '#363433'
  on-surface: '#e7e1df'
  on-surface-variant: '#cec5ba'
  inverse-surface: '#e7e1df'
  inverse-on-surface: '#32302e'
  outline: '#978f86'
  outline-variant: '#4c463e'
  surface-tint: '#d3c4b1'
  primary: '#fff6ee'
  on-primary: '#382f22'
  primary-container: '#e8d9c5'
  on-primary-container: '#695e4e'
  inverse-primary: '#675d4d'
  secondary: '#ffb59f'
  on-secondary: '#5e1600'
  secondary-container: '#802a0d'
  on-secondary-container: '#ff9b7d'
  tertiary: '#d9fffe'
  on-tertiary: '#003737'
  tertiary-container: '#9ee8e8'
  on-tertiary-container: '#176a6b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0e0cc'
  primary-fixed-dim: '#d3c4b1'
  on-primary-fixed: '#221a0e'
  on-primary-fixed-variant: '#4f4537'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#802a0d'
  tertiary-fixed: '#a6efef'
  tertiary-fixed-dim: '#8ad3d3'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#004f50'
  background: '#141312'
  on-background: '#e7e1df'
  surface-variant: '#363433'
typography:
  display-xl:
    fontFamily: Epilogue
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.15em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  sidebar-width: 280px
---

## Brand & Style

This design system establishes a high-fidelity, immersive environment for competitive gamers. It departs from the "utility-first" look of typical social apps, moving instead toward the cinematic depth of a modern game launcher. The brand personality is prestigious yet visceral—it feels like the "inner sanctum" of a gaming squad.

The style is a fusion of **Glassmorphism** and **Tactile Layering**. It leverages the structural integrity of the Arc browser (sidebars, nested views) with the atmospheric lighting and texture found in Riot Games’ client interfaces. The aesthetic prioritizes "The Big Moment"—using large, expressive artwork and broken grids to create a sense of scale and momentum. This is a system built for discovery and social prestige, where finding a squad feels like embarking on a high-stakes mission.

## Colors

The palette is anchored in a cinematic "Deep Sea" spectrum, moving from a desaturated navy base to muted charcoal blue. Unlike standard dark modes, this system completely avoids #000000 to maintain a softer, atmospheric contrast.

- **Warm Cream (#E8D9C5):** Used for primary typography and high-contrast labels to provide a sophisticated, tactile feel against the dark backgrounds.
- **Dusty Orange & Muted Coral:** These serve as the "Action" and "Intensity" colors. They indicate active states, notifications, and "Live" status, providing warmth without the aggression of neon reds.
- **Soft Teal Accents:** Reserved for secondary utilities like online status, success states, or cooperative squad indicators.
- **Cinematic Gradients:** Backgrounds should utilize subtle radial gradients (Navy to Charcoal) to simulate a light source coming from the top-center or the primary artwork.

## Typography

This system uses a tiered typographic hierarchy to balance editorial flair with high-performance legibility.

- **Headlines (Epilogue):** An expressive sans-serif with a bold, almost serif-like personality in its heavier weights. Use this for player names, game titles, and major section headers. It should feel impactful and "heavy."
- **Body (Hanken Grotesk):** A clean, modern sans-serif chosen for its high x-height and excellent readability during fast-paced social interactions.
- **Technical Labels (Space Grotesk):** A geometric, slightly technical font used for metadata (ping, player count, timestamps). The "monospaced" energy adds a layer of "game-launcher" utility.

Typography should often be used as a design element itself—large, low-opacity letters can sit behind content to act as structural anchors in broken grid layouts.

## Layout & Spacing

The design system utilizes an **Asymmetrical Broken Grid**. Instead of rigid vertical columns, content containers are encouraged to overlap or use "offsetting" to create a more dynamic, cinematic flow.

- **Breathing Room:** We utilize "oversized" margins (64px+) on desktop to create a premium, uncrowded feel.
- **The "Arc" Sidebar:** Navigation is pinned to a wide, grounded left-hand sidebar that contains the user profile and primary squad navigation. 
- **Card Flow:** Content cards for "Suggested Squads" or "Trending Games" should vary in size (e.g., a 2x2 large featured card next to several 1x1 cards) to prevent the layout from looking like a standard dashboard.
- **Transitions:** Layout shifts should feel mechanical yet smooth—sidebar expansion and card hover-states should feel like a physical camera movement within a game environment.

## Elevation & Depth

Depth is the defining characteristic of this system. We avoid flat surfaces in favor of a "physical stack" of materials.

- **Base Layer:** The deepest navy background, often with a subtle grain texture to simulate high-end film stock.
- **Surface Containers:** These use 40-60% opacity of the charcoal blue, layered with a `backdrop-filter: blur(20px)`. This creates the "glassmorphism" effect where background artwork peeks through.
- **Atmospheric Glows:** Elements do not use traditional drop shadows. Instead, use colored "Outer Glows" (10-15% opacity of the element’s primary color) to make interactive components feel like they are emitting light.
- **Inner Borders:** Every container should have a 1px top-and-left "light-source" border (Warm Cream at 10% opacity) to define its edge against the dark background.

## Shapes

The shape language is sophisticated and controlled. We avoid the "bubbly" look of casual social apps, opting for a **Rounded (0.5rem / 8px)** base that feels architectural.

- **Primary Cards:** Use `rounded-lg` (1rem) to feel like separate, floating objects.
- **Avatars & Game Art:** These should be contained in squarcles or strictly defined rounded rectangles rather than perfect circles, maintaining the "launcher" aesthetic.
- **The "Broken" Edge:** Occasionally, allow a background image or a decorative shape to have 0px radius on one side (e.g., the side touching the screen edge) to emphasize the immersive, full-screen nature of the platform.

## Components

### Buttons
Buttons are high-contrast anchors. Primary buttons use a solid **Dusty Orange** or **Warm Cream** fill with dark text. Secondary buttons are "ghost style" with a 1px border and a subtle glass blur on hover. No icons—use bold `label-caps` text.

### Immersive Cards
The core of the system. Cards must contain background artwork (game concept art or player banners). Content is overlaid using a bottom-up gradient scrim. Typography on cards should use the `headline-md` for titles and `label-caps` for stats.

### Glass Lists
Social feeds and squad lists are rendered on semi-transparent blurred surfaces. Hovering over a list item should trigger a "scanning" light effect (a subtle white gradient sweep) rather than just a color change.

### The "Squad" Chip
Status indicators are not dots. They are small, stylized typographic blocks (e.g., "[RDY]" in Soft Teal or "[LFM]" in Muted Coral) using `Space Grotesk`.

### Inputs
Search and text fields are ultra-minimal: a single bottom border or a very dark, inset "well" with no heavy outlines. Focus states are indicated by a soft outer glow in the primary brand color.
# Konkourix Design System Direction

**Status:** APPROVED DESIGN DIRECTION
**Product Owner decision:** 2026-10-01

This document is the visual/design-system source of truth. Product behavior and scope come from [PRODUCT_MAP.md](PRODUCT_MAP.md), sequencing comes from [ROADMAP.md](ROADMAP.md), and implemented reality comes from [PROJECT_STATE.md](PROJECT_STATE.md). Design guidance must not redefine those documents or authorize UI work outside an approved milestone.

## Visual Source of Truth

Only Product Owner-approved reference images for a specific surface are that surface's visual specification, not loose inspiration. Historical references must not be applied indiscriminately to every page. Scoped implementation should converge toward the applicable references' composition, information density, layout hierarchy, card system, navigation, top bars, chart presentation, X/wordmark presence, blue/violet/cyan accents, premium light mode, professional navy dark mode, and responsive product quality.

Implementation must interpret the references responsively and accessibly rather than mechanically copying pixels. It must not replace the approved direction with generic developer-designed dashboards.

The Public Web, Student, Counselor, future School, and future Admin surfaces belong to the same Konkourix brand family and token system. Their navigation, hierarchy, and density may differ by role and purpose.

External educational products may be used for capability benchmarking, information-architecture study, and competitive research. They are not the Konkourix visual identity source.

## Foundation

- Persian-first RTL.
- In Persian layouts, the primary sidebar is on the right.
- On mobile, primary navigation uses a hamburger and right-side drawer. A main bottom-navigation replacement is not approved.
- Full light and dark theme support.
- Modern educational SaaS: professional, optimistic, student-friendly, premium, and approachable.
- Restrained glassmorphism; readability and operational clarity take priority.
- No sci-fi, gaming-neon, or childish visual treatment.

## Color Tokens

### Brand

| Token | Value |
| --- | --- |
| Primary Blue | `#2563EB` |
| Violet | `#8B5CF6` |
| Cyan | `#06B6D4` |
| Deep Navy | `#0F172A` |

### Light Theme

| Token | Value |
| --- | --- |
| Canvas | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Soft surface | `#EEF4FF` |
| Text | `#0F172A` |

### Dark Theme

| Token | Value |
| --- | --- |
| Canvas | `#0B1220` |
| Surface | `#111827` |
| Elevated | `#162033` |

Dark mode is mostly matte and solid. Glow is reserved for selected, high-value brand moments rather than routine cards, tables, and controls.

## Role-Specific Hierarchy

### Student

- Calmer and more motivational.
- The dashboard answers “what should I do now?” first.
- Immediate action and current plan precede analytics.
- Analytics sit lower in the visual and interaction hierarchy.

### Counselor

- Denser and more operational.
- Fast planning, student context, exceptions, and evidence take priority.
- Decoration must not reduce information efficiency.

## Brand X

Use the same geometry for both X variants:

- glossy/glass at large brand scale;
- simplified flat at favicon, sidebar, and small-UI scale.

## Illustration

A 3D student illustration is limited to marketing, login, onboarding, and selected banners. Do not repeat it across data-heavy planning, reporting, assessment, or operational workflows.

## Typography

- Persian: IRANSansX only when owner-supplied licensed files already exist.
- Persian fallback: Vazirmatn, then appropriate system fonts.
- English: Inter.
- Do not embed licensed font binaries unless the Product Owner has supplied and authorized them.

## Interaction and Accessibility

RTL behavior must be intentional rather than a mirrored afterthought. Theme and glass treatments must preserve legibility, focus visibility, interaction states, and accessible contrast. Motion and decoration must support meaning and must not obstruct task execution.

## Decision Gate

Any unapproved Student-facing capability, workflow, or major visual or interaction change must return to the Product Owner as a Decision Gate before implementation.

## State Classification

### CURRENT IMPLEMENTED STATE

Light/dark and RTL foundations exist. The current working tree contains ongoing Student/Counselor shell convergence, but full conformance to the approved references, tokens, role-specific rules, and responsive quality has not been established by this documentation milestone.

### APPROVED FUTURE STATE

The reference-image authority, rules, tokens, surface-family relationship, and mobile navigation direction in this document are approved for future scoped UI milestones.

### EXPLORATORY / DEFERRED

Component specifications, spacing, type scale, responsive breakpoints, semantic status colors, motion tokens, and final asset files remain deferred. They must not be invented under this milestone.

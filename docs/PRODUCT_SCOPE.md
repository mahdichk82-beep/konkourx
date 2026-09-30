# Konkourix Product Scope

**Status:** APPROVED PRODUCT SCOPE LOCK
**Product Owner decision:** 2026-09-30

This document is the authoritative scope boundary for Konkourix. A roadmap, architecture note, historical milestone, proof of concept, or future design cannot expand this scope by itself.

Konkourix is primarily a Student ↔ Counselor planning, execution, performance, reporting, and communication SaaS.

## CURRENT IMPLEMENTED STATE

The repository currently provides working foundations for authentication/session handling, student planning and task lifecycle, student-owned subjects/topics, study execution, completed assessment-attempt tracking, account settings, counselor access to assigned students, and counselor task creation. Several dashboards, reports, communication flows, goals/habits/focus features, notifications, subscriptions, administration capabilities, and production operations remain partial, placeholder, or absent.

The rejected Curriculum governance and Knowledge runtime has been removed from the active API. A minimal file-backed Canonical Curriculum runtime now provides authenticated read-only access to the protected source projection; it has no Curriculum database persistence, write/admin API, governance, or product-record integration. Recovery Foundation 4 retired the unused historical governance Prisma models and PostgreSQL objects through a forward migration while preserving immutable migration history. Educational source data remains protected by [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md).

## APPROVED FUTURE STATE

The following product areas are in scope when explicitly scheduled by an approved milestone:

- student panel;
- counselor panel;
- curriculum selection;
- planning;
- task ownership;
- study execution;
- assessment tracking;
- reports;
- communication;
- contextual tickets and messages;
- counselor private notes;
- goals, habits, and focus;
- notifications;
- future Question Bank;
- future admin capabilities;
- subscriptions;
- production deployment.

In-scope status does not mean implemented, designed, or authorized for the current milestone.

## Curriculum Purpose

Curriculum exists to provide:

- a shared planning reference;
- consistent progress measurement;
- rapid plan construction;
- future question linking.

Curriculum is not an educational-content production or scientific-governance platform.

## Out of Scope

The following are rejected product directions and must not be implemented or treated as dependencies:

- AI Educational Reviewer;
- Human Scientific Review Workflow;
- Knowledge Package;
- Knowledge Expansion Package;
- formula verification engine;
- scientific approval engine;
- question-pattern taxonomy;
- skill taxonomy;
- curriculum-as-knowledge-graph;
- educational content-production machinery.

Historical repository artifacts may describe these directions. Their presence records history and does not restore them to scope.

## Question Bank Future Direction

The approved direction is:

- authorized users may submit questions;
- admin review is required before official publication;
- an approved question links to existing Curriculum location or locations;
- exact curriculum-link cardinality still requires a Product Owner decision;
- questions carry difficulty classification;
- Question Bank remains separate from canonical Curriculum authority and cannot alter Curriculum.

No Question Bank runtime implementation is authorized by this document alone.

## EXPLORATORY / DEFERRED

Detailed workflows, permissions, data models, sequencing, pricing, and operational policies for approved future areas remain deferred until the Product Owner and architect approve a milestone. Ambiguity is a decision gate, not permission to invent behavior.

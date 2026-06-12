# Spec 009 — Vision Produit V2 SaaS

## Context

Project: AGENT RS, currently a Next.js App Router application for AI-assisted social media content generation, validation, scheduling, and Meta publishing.

The product direction is evolving from an internal-only operating tool into a professional SaaS-ready platform for agencies and freelancers managing multiple clients, collaborators, and client portals.

The V1 workflow must remain usable while V2 foundations are introduced progressively.

## Goal

Transform V1 into a collaborative, multi-client, multi-user, secure content operations platform without rebuilding the product from scratch.

## Product Scope

### Administrator Space

Admins must be able to:

- create and manage clients;
- manage subscriptions;
- manage users;
- visualize global statistics;
- generate content;
- validate or reject content;
- manage media;
- manage connected social networks.

### Collaborator Space

Collaborators must be able to:

- access only authorized clients;
- generate content;
- edit content;
- send content for validation;
- consult history;
- manage associated media.

### Client Portal

Each client must have a secure portal.

Clients must be able to:

- view pending content;
- view approved content;
- view published content;
- consult historical content;
- approve content;
- request modifications;
- leave comments;
- reject content;
- upload photos, videos, logos, brand guidelines, and documents;
- maintain company information.

### Client Company Information

The platform should progressively model:

- company name;
- industry/activity;
- website;
- social links;
- contact details;
- visual identity;
- communication tone;
- targets/personas;
- competitors;
- offers;
- products;
- services.

### Client Onboarding

The onboarding should reduce manual exchanges by collecting:

- company name;
- sector;
- website;
- country;
- language;
- timezone;
- target audience;
- personas;
- offers;
- competitive advantages;
- competitors;
- business objectives;
- social accounts: Facebook, Instagram, LinkedIn, TikTok, X, YouTube;
- examples of liked posts;
- examples to avoid;
- desired tone;
- desired publishing frequency;
- logos;
- photos;
- videos;
- brand guidelines;
- documents.

## Future Social Integrations

Design the integration layer for:

- Meta: Facebook and Instagram;
- LinkedIn;
- TikTok;
- X;
- YouTube.

Requirements:

- API keys and tokens must never be exposed in frontend code.
- Tokens must be encrypted or stored through a secure secret storage strategy.
- Token renewal should be automated when the provider allows it.
- Provider-specific code should stay isolated behind a common publishing interface.

## Security Requirements

V2 must be designed for a professional security baseline:

- secure authentication;
- user roles and permissions;
- strict tenant/client data separation;
- encryption for sensitive data;
- audit logs;
- protection against unauthorized access;
- robust session management;
- backups.

## Scalability Requirements

The architecture must be able to grow from:

- 10 clients;
- to 100 clients;
- to 1,000 clients.

Plan for:

- modular architecture;
- centralized API layer;
- permission system;
- separate media storage;
- queue-based AI processing;
- monitoring;
- AI cost tracking and budget controls.

## Recommended Migration Phases

### Phase 1 — Stabilize V1

Keep the current client -> strategy -> Library -> Studio -> validation -> calendar -> Meta publication flow stable.

Do not start broad SaaS refactors until:

- client creation is reliable;
- Facebook and Instagram publishing are reliable;
- media storage is production-safe;
- generated content is reviewable and traceable;
- costs are visible.

### Phase 2 — Data Model Foundations

Introduce the future SaaS model without replacing the UI immediately:

- organizations/agencies;
- users;
- memberships;
- roles;
- client access grants;
- client onboarding records;
- client comments;
- audit logs.

### Phase 3 — Authentication and Permissions

Replace single-password test auth with:

- real user accounts;
- role-based access control;
- client-level permissions;
- protected client portal sessions.

### Phase 4 — Client Portal

Expand the existing portal into a real secure client workspace:

- pending content;
- approvals;
- revision requests;
- comments;
- media uploads;
- company profile completion.

### Phase 5 — Queue and AI Operations

Move long-running AI jobs to a queue-backed system:

- image generation;
- image editing;
- video generation;
- DA analysis;
- strategy generation;
- scheduled publishing;
- token refresh jobs.

### Phase 6 — SaaS Operations

Add:

- subscriptions;
- billing;
- usage limits;
- team management;
- monitoring;
- backups;
- production observability.

## Implementation Rules

- Do not expose secrets in client components.
- Do not mix admin, collaborator, and client permissions in ad hoc UI checks.
- Do not duplicate provider logic inside pages.
- Do not remove V1 flows while migrating.
- Prefer small migrations that are backward compatible.
- Every new SaaS concept must include data ownership: organization, user, client, or portal visitor.

## First Technical Milestones

1. Add a product roadmap page or internal status page for V1 -> V2.
2. Add `organizations`, `users`, `memberships`, and `client_access` schema drafts.
3. Define roles: `owner`, `admin`, `collaborator`, `client`.
4. Add audit log schema.
5. Add onboarding schema and first onboarding form.
6. Expand client portal to comments and approval/revision states.
7. Add secure token storage plan before adding more social providers.

## Validation

For implementation tasks derived from this spec:

```bash
npm run lint
npm run build
```

Manual validation must include:

```text
admin/collaborator/client role cannot access unauthorized client data
client portal can approve/request changes without exposing admin pages
tokens are never rendered in HTML or returned through public APIs
```

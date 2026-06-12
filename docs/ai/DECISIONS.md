# CODEXRS Decisions

This file records stable decisions so Claude and Codex keep the same direction.

## Product Direction

- AGENT RS started as an internal agency operating system.
- The V2 target is a SaaS-ready collaborative platform for agencies/freelancers managing multiple clients.
- The transition must be progressive: keep the V1 production workflow stable while introducing SaaS foundations.
- The first market is HORECA: bars, restaurants, hotels, guesthouses, and chambres d'hote.
- The MVP priority is automatic high-quality Facebook/Instagram post creation with human validation.
- Automatic publishing can exist, but validation stays required until the system is proven reliable.

## V2 SaaS Direction

- Add administrator, collaborator, and client portal spaces.
- Introduce real users, roles, permissions, and client-level access control before opening collaboration broadly.
- Store social tokens securely and never expose secrets in frontend code.
- Prepare for future providers: Meta, LinkedIn, TikTok, X, and YouTube.
- Add onboarding forms that collect client business, marketing, social, content, and media context.
- Plan queue-based AI jobs for image/video generation, media analysis, scheduled publishing, and token refresh.
- Track AI/API costs per client before scaling paid usage.

## Core Workflow

```text
Client profile
-> Strategy
-> Library and Direction Artistique
-> Studio generation
-> Impact review
-> Human validation
-> Calendar
-> Meta publication
-> Performance learning
```

## Agent Chain

- Account Director loads client context and clarifies the mission.
- Strategy Director selects the marketing angle.
- Social Director writes platform-specific posts.
- Visual Director generates or adapts visual direction.
- Impact Reviewer scores risk and expected performance.
- Publisher schedules or publishes only when allowed.
- Performance Analyst learns from results later.

## Technical Direction

- Next.js App Router remains the main application framework.
- LibSQL is used locally and can migrate to Turso for production.
- Local file storage is acceptable in dev; Vercel Blob is preferred for production.
- Meta page access tokens are per-client connection data, not global app config.
- Secrets must stay in `.env.local` locally and Vercel Environment Variables in production.

## Current Production Risk

- Production must not depend on `file:./codexrs.db` on Vercel.
- Use Turso or another persistent LibSQL-compatible database for real client data.
- Use public image URLs for Meta publishing. `localhost` URLs cannot be used by Meta.

# Software Architecture for Vicar

## Current Phase: Payroll / Billing Engine (MVP Slice)

Target subsystem: Payroll / Billing Engine
Adjacent subsystems: None yet (isolated)
Verification: Sample timesheets produce correct invoices/payments matching pricing-strategy.md math
Rollback: git revert

This document expands the core-business-plan and tech-strategy with the flexible pricing engine requested.

## Flexible Pricing Models (per-client configurable)

The engine supports ALL common staffing markup methods. Configured per Client or per Contract via a Pricing Profile.

1. Percentage markup on pay rate
2. Markup on burdened/loaded costs
3. Fixed / negotiated bill rates (rate cards)
4. Banded / tiered pricing (default)
5. Blended / average rate
6. Fixed fee / project-based / SOW
7. Temp-to-hire with conversion fees
8. Direct-hire placement fees
9. Hybrids (volume discounts, OT rules, etc.)

See full details in the conversation history or pricing-strategy.md for banded example.

## Core Components

- PricingProfile entity (per client)
- Strategy-based calculator
- Timesheet → Invoice flow
- Compliance guards

Full DB schema and TS code to be implemented next.

## Tech Stack Reminder
TypeScript/Node + Next.js + Postgres + Docker

Next step: Implement the Pricing Engine with all models.

**This change follows stabilization-pr-checklist.md and change-impact-map.md.**
Target subsystem: Documentation & initial software architecture
Verification: File readable, references correct
Rollback: git revert
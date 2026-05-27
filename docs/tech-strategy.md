# Technology Strategy — Vicar

**Last updated:** May 6, 2026  
**Status:** Early draft — principles first, specific tools later

This document outlines the guiding principles for all technology decisions. It supports the core business plan by focusing on transparency, fairness, simplicity, and building tools that genuinely help clients reduce overtime and improve scheduling.

Any tech-related change or recommendation must follow `docs/stabilization-pr-checklist.md` and `docs/change-impact-map.md`.

## Core Principles

1. **Scheduling & Optimization First**
   - Our biggest differentiator will be helping clients reduce unnecessary overtime and improve workforce planning.
   - Any tool we build or buy must make scheduling easier and more intelligent.
   - This directly supports our pricing model (higher OT rates in Band 2 become a feature, not a bug).

2. **Transparency and Fairness by Design**
   - Workers and clients should understand how rates, schedules, and decisions are made.
   - Avoid black-box AI for critical decisions (pay, scheduling, ranking) unless we can explain the reasoning in plain English.

3. **Simplicity Over Complexity**
   - Prefer tools that are easy for recruiters, hiring managers, and contractors to use.
   - Start with no-code/low-code solutions where possible so we can iterate quickly without a large engineering team.
   - Only build custom software when it creates a real competitive advantage (e.g. integrated scheduling + invoicing + compliance).

4. **Compliance and Data Privacy as Non-Negotiable**
   - Hotspot area. All systems must have strong audit trails, consent management, and data minimization.
   - Prioritize platforms with good compliance certifications (SOC 2, HIPAA if healthcare, etc.).
   - Worker classification, OT rules, and payroll compliance must be built into the workflow.

5. **Integrations Over Building Everything**
   - We will not build our own full ATS, CRM, or payroll system from scratch at the beginning.
   - Focus on best-of-breed tools that integrate well (via API, Zapier, or native connectors).
   - Our custom layer should sit on top — primarily for scheduling intelligence, unified dashboard, and automated invoicing.

6. **Scalable and Modern Foundation**
   - Cloud-first (AWS, Azure, or GCP — to be decided based on cost and compliance).
   - Prefer TypeScript/JavaScript ecosystem for custom work (easier to hire and maintain).
   - Use PostgreSQL or similar for the database.
   - Emphasize automated testing, CI/CD, and infrastructure-as-code from day one.

## Recommended First Tech Slice

Aligning with the core business plan's MVP focus, our first technology investment should be in **scheduling, time tracking, and automated invoicing**.

This directly ties to:
- Reducing client OT costs (Band 2)
- Improving cash flow
- Strengthening our compliance story
- Creating a moat that is hard for traditional staffing firms to copy

We can start with off-the-shelf tools (e.g. a combination of an existing workforce management platform + custom dashboard) before building anything proprietary.

## Next Actions

1. Research 3–5 existing scheduling/time-tracking platforms that integrate with popular payroll and ATS systems.
2. Define detailed requirements for the scheduling tool based on customer discovery.
3. Create a simple tech decision matrix using the principles above.
4. Update this document with specific tool recommendations after validation.
5. Add tech principles to the stabilization checklist for future decisions.

---

**How this document is maintained:**
Any significant change must follow the stabilization checklist. Before proposing a specific tool or architecture, always answer the 4 questions from `docs/change-impact-map.md` (target subsystem, adjacent impacts, verification, rollback).

This tech strategy is intentionally principles-first. We will not choose a full stack until we have validated our first product slice with real customers.

**Connection to pricing:** The scheduling tool will make the higher OT rates in Band 2 more palatable by helping clients avoid them.

This document works alongside `core-business-plan.md` and `pricing-strategy.md`.

# Vicar — Planning Playbook

This repository is the **docs-only foundation** for our company (Vicar). 

We avoid using "staffing" in the legal or primary company name for tax and classification reasons. Internally we operate in the talent acquisition and professional services space.

It contains:
- Business strategy and technical planning documents
- Plain-English glossary for our industry and processes (`docs/staffing-glossary.md`)
- Strict but practical rules for how we make changes (so AI and humans stay aligned)
- Checklists that keep us focused on small, safe, reviewable steps

We start here with **docs only** so we can think clearly before writing any code.

**Current phase:** Planning & foundation (no application code yet)

## How We Use This Playbook

1. **Read first** — Start with `docs/staffing-glossary.md`, `docs/core-business-plan.md`, and `docs/stabilization-pr-checklist.md`
2. **Plan in small slices** — Every major decision gets documented with clear target subsystem, impacts, verification steps, and rollback plan (see `docs/change-impact-map.md`)
3. **Keep changes focused** — Prefer small, reviewable edits over big rewrites
4. **Use plain English** — Especially for industry terms like markup, VMS, MSP, candidate pipeline, and compliance (see glossary)

## Core Documents

- `docs/core-business-plan.md` — **Our primary strategic document** (created first)
- `docs/staffing-glossary.md` — Plain English definitions for industry and process terms
- `docs/stabilization-pr-checklist.md` — Quality gate before any significant change
- `docs/change-impact-map.md` — Helps us understand target subsystems, adjacent impacts, verification, and rollback
- `.cursor/rules/` — Makes the above rules apply automatically in Cursor

## Current Focus (May 2026)

We are in **pure planning mode**. The goal is to:
- Clearly define our vision, business model, and first focus area (without using "staffing" in the legal entity name)
- Choose our first narrow product slice (MVP)
- Build shared understanding before writing any code

**Next step:** Review and flesh out the new core business plan.

## Notes

- The rules are intentionally strict during planning so we don't rush into the wrong business or technical choices
- "Staffing" appears in some document filenames and industry descriptions for clarity, but we will not use it in the legal company name
- We can relax certain checklist items once we have validated our direction with real customer conversations

**Target subsystem for this change:** Documentation & branding layer  
**Adjacent impacts:** Cursor rule enforcement, future product docs  
**Verification:** All files readable, no broken references, company name neutralized  
**Rollback:** `git revert` — purely additive documentation changes

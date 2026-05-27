# Stabilization Checklist

Use this checklist for any non-trivial change to docs, processes, or code.

## 1) Scope and Intent
- [ ] Change is focused (one clear goal)
- [ ] Target subsystem is explicitly named (see `change-impact-map.md`)
- [ ] No unrelated changes slipped in
- [ ] Plain English summary is included

## 2) Hotspot Guardrails
- [ ] If touching a hotspot document or code, extra review is planned
- [ ] Current business behavior is preserved unless intentionally changed
- [ ] We document what must stay the same (e.g. "we never lose a candidate submission")

## 3) Business & Technical Parity
- [ ] We have described or tested how this affects real staffing workflows
- [ ] We state clearly what behavior is *not* changing
- [ ] Key invariants are preserved (see glossary)

## 4) Verification
- [ ] Manual steps to test the change are documented
- [ ] We have at least one concrete way to verify it works (screenshot, test data, walkthrough)
- [ ] Failure scenarios considered (what if a candidate rejects an offer? what if client pushes back on rate?)

## 5) Safety & Compliance
- [ ] Compliance, data privacy, or billing impact considered
- [ ] No accidental change to how we handle money, candidate data, or legal obligations

## 6) Rollback and Blast Radius
- [ ] Rollback steps are documented (usually just `git revert`)
- [ ] Blast radius is stated (who or what could this affect?)
- [ ] Adjacent subsystems identified (see `change-impact-map.md`)

## 7) Checkpoint Gate
- [ ] This change moves us forward on our current planning milestone
- [ ] If this is part of a larger plan, next step is clear

## 8) Reviewer Summary
- [ ] Problem statement / opportunity
- [ ] What changed
- [ ] What did *not* change (important for staffing processes)
- [ ] Key risks and how we mitigated them
- [ ] How to verify this works

**Adapted for staffing company planning (May 2026).** We care most about clear thinking, preserving important business rules, and not rushing technical decisions.

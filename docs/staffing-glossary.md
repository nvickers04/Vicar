# Staffing Company Plain-English Glossary

Use this when discussing business, technical, or process terms. The goal is shared understanding between founders, AI, recruiters, and developers.

## Core Staffing Business Terms

- **Markup**  
  The difference between what the client pays and what the contractor/employee earns. This is how the staffing company makes money.

- **Candidate pipeline**  
  The list of people we're actively talking to, screening, and preparing for roles.

- **Submission**  
  When we send a candidate's profile to a client for a specific job.

- **Placement**  
  When a candidate is successfully hired/engaged through us and starts working.

- **VMS (Vendor Management System)**  
  Software that large companies use to manage all their staffing vendors in one place.

- **MSP (Managed Service Provider)**  
  A company that manages multiple staffing vendors for a client. Sometimes we act as the MSP.

- **Time & Expense (T&E)**  
  The weekly process where contractors report hours worked and any expenses. This drives our invoicing.

- **Corp-to-Corp (C2C)**  
  When the worker is their own company (has their own business entity) rather than a W-2 employee.

- **Compliance**  
  Making sure we follow all the legal rules around taxes, background checks, insurance, worker classification, etc.

- **Requisition**  
  A formal request from a client for a new worker (also called "job order" or "req").

## Technical & Process Terms (from the playbook)

- **Target subsystem**  
  The specific part of the business or code we're changing right now (e.g. "candidate tracking" or "billing logic").

- **Adjacent subsystem impact**  
  Other parts that might be affected by this change (e.g. changing how we track submissions might affect reporting).

- **Blast radius**  
  How far and wide a change could cause problems. Small blast radius = safe to ship quickly.

- **Characterization test**  
  A way to document "this is how the business process works today" so we don't accidentally break it later.

- **Invariant**  
  A rule that must always stay true (e.g. "we never send a candidate to a client without their consent").

- **Hotspot file**  
  A document or piece of code we change often. These need extra care and review.

- **Refactor**  
  Improving how something is organized or written while keeping the actual business outcome exactly the same.

- **Rollback**  
  The steps to safely undo a change if something goes wrong.

- **Cohesion**  
  Keeping related ideas together so the documents and code stay understandable.

## Rule of Thumb

If a term might be confusing to a recruiter, a developer, or the AI — define it here in plain English before using it in plans or code.

**Last updated:** May 2026 (Planning phase)

# Change Impact Map

Before making any significant change to our docs, processes, or future code, answer these four questions:

1. **What subsystem is changing?** (target subsystem)
2. **Which adjacent subsystems could be affected?**
3. **How will we verify nothing important broke?**
4. **What is our rollback plan?**

## Common Subsystems in a Staffing Company

### Candidate & Submission Flow
- Usually affects: pipeline tracking, recruiter workflow, client visibility
- Adjacent impact: reporting, compliance, notifications
- Must verify: no submissions get lost, candidate consent preserved

### Client & Requisition Management
- Usually affects: job orders, rate cards, contract terms
- Adjacent impact: billing, compliance, sales pipeline
- Must verify: pricing logic stays consistent, compliance rules still enforced

### Time, Billing & Payroll
- Usually affects: invoicing, contractor payments, margins
- Adjacent impact: compliance (tax, worker classification), cash flow reporting
- **High risk area** — verify money movement and legal obligations

### Compliance & Data Privacy
- Usually affects: background checks, consent, data retention
- Adjacent impact: almost everything (candidate flow, client portal, reporting)
- Must verify: we never make it easier to violate rules

### Reporting & Analytics
- Usually affects: dashboards, margin tracking, placement rates
- Adjacent impact: data sources from other subsystems
- Must verify: numbers still add up correctly

---

## Required Cross-Impact Questions (use every time)

1. What is the **target subsystem** for this change?
2. What **adjacent subsystems** might be impacted? (list them)
3. What **verification steps** prove we didn't break anything important?
4. What is the **rollback approach** if something goes wrong?

## Hotspot Reminder (treat with extra care)
- Time/Billing/Payroll logic
- Compliance and candidate data handling
- Anything that touches money or legal obligations

**Updated for staffing company planning (May 2026).** We are not building software yet — this map helps us think through business process changes and future technical decisions without painting ourselves into a corner.

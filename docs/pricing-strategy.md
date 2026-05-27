# Pricing Strategy — Vicar

**Last updated:** May 4, 2026  
**Status:** Draft — to be validated with real customer conversations and financial modeling

**Key policy added:** Fixed band rates with clear explanation for when actual average pay differs from band assumption.

This document is the single source of truth for all pricing decisions. It contains the mathematical banded model we will use in specific industries.

## Core Philosophy

Our pricing must:
- Be transparent and predictable for clients
- Protect healthy margins across varying pay rates
- Discourage excessive overtime on higher-paid roles 
- Scale mathematically without manual skill tiers
- Support the client benefit of **not worrying as much about overtime** on common lower-wage roles

## Mathematical Banded Model

We use **pay-rate bands** with **fixed bill rates** calculated from the average pay rate within each band. This greatly simplifies invoicing — every worker in a band has the same bill rate.

**Formula (applied per band):**
- Calculate the **actual average pay rate of all workers assigned to that band** during the billing period.
- `Band_ST_Bill_Rate = Band_Actual_Average_Pay × ST_Multiplier`
- `Band_OT_Bill_Rate = Band_ST_Bill_Rate × OT_Multiplier`
- All hours in the band are invoiced at this calculated rate.

This produces simple, predictable per-band pricing that automatically reflects the client's actual mix of work.

### Current Bands & Multipliers (to be validated with real data)

**Band 1: $15 – $30/hr pay** (primary volume band — lower-wage roles)
- ST Multiplier: **1.42x**
- OT Multiplier: **1.35x**
- **Client benefit:** OT remains reasonably priced, so clients do not have to worry as much about scheduling overtime for these common roles.

**Band 2: $31 – $55/hr pay** (higher-wage / skilled roles)
- ST Multiplier: **1.28x**
- OT Multiplier: **1.75x**
- **Client benefit:** Predictable pricing with strong financial incentive to minimize overtime on higher-paid workers. Our future scheduling tools will help clients reduce these costs.

For new customers, we start with industry-typical averages to propose initial rates. Once we have actual data from their workers, we use the real average pay per band to calculate the bill rate.

### Example: How Average is Calculated per Band

**Band 1 Example (4 workers this week):**

| Worker | Pay Rate | Hours | 
|--------|----------|-------|
| Worker A | $18.00 | 40 |
| Worker B | $22.00 | 40 |
| Worker C | $27.50 | 32 |
| Worker D | $29.00 | 40 |

- Total Pay = ($18×40) + ($22×40) + ($27.50×32) + ($29×40) = $3,520
- Total Hours = 152
- **Average Pay Rate** = $3,520 / 152 = **$23.16/hr**
- **ST Bill Rate** = $23.16 × 1.42 = **$32.89/hr**
- **OT Bill Rate** = $32.89 × 1.35 = **$44.40/hr**

All 152 hours would be invoiced at these calculated rates for the band.

This is the method we use. It automatically adjusts to the client's actual mix each period.

(The "Current Bands" section above shows the multipliers we apply to the calculated average.)


**Common client question:** "My average pay this week was $25/hr in Band 1. Why am I being billed $35.50?"

**Our response:** "We calculate the bill rate for each band using the actual average pay rate of the workers assigned to that band during the billing period. For your $25 average in Band 1, the rate is $35.50 ($25 × 1.42). This gives you predictable per-band pricing that reflects the mix of work you send us. If the average in a band changes significantly over time, we can review the band structure together."


## Why This Model Is Better

- **Much simpler invoicing** — one fixed rate per band instead of calculating per worker
- More profitable than a single company-wide average (stronger markup on high-volume Band 1)
- Highly predictable and transparent for clients (they know exactly what each hour will cost)
- Maintains the key client selling point on Band 1 (affordable OT)
- Protects our margins even when actual pay rates vary within the band
- Fully mathematical, scalable, and easy to automate
- Only applied in industries where this pricing advantage makes sense

**Handling rate questions:** We proactively explain the fixed-band approach up front. If a client's actual average pay drifts consistently outside our band assumptions, we review and reassign bands rather than renegotiating individual rates. This keeps the relationship clean and scalable.

## Implementation Notes

- Bands, assumed average pay rates (starting with industry benchmarks), and multipliers will be stored in a simple configuration (easy to update quarterly as we gather real data).
- For **new customers** without history, we start with the benchmark rates shown above (or slightly adjusted based on discovery conversation about their typical pay ranges).
- Sales will present **fixed rate cards** (showing only the final ST/OT rates per band, not the internal math or assumed averages).
- After the first 30–60 days, we review the client’s **actual average pay per band**. If it is consistently higher or lower than our assumption, we adjust the fixed rate or reassign the band at the next contract period.
- Future scheduling and time-tracking software will use these fixed band rates for automatic invoicing.
- This gives us a practical way to set initial rates without historical data while protecting long-term margins.

## Next Steps for This Document

1. Validate bands and multipliers with 8–10 potential clients in target industries
2. Build basic financial model showing projected overall gross margin (target 34–40%)
3. Create sample client rate cards
4. Review legal/tax implications with advisors (especially OT rules)

---

**How this document is maintained:**
Any change to pricing must follow `docs/stabilization-pr-checklist.md` and reference `docs/change-impact-map.md`. Always consider impact on our vision of fairness, transparency, and employee protection.

## Client-Facing Presentation & Rate Cards

**You must tell the client the rates.** The question is *how* you present them.

### Recommended Approach

Do **not** explain bands, multipliers, assumed averages, or internal math. Present the rates as **simple, all-inclusive packaged service rates**.

**Preferred language to use with clients:**

"We offer two clear, predictable hourly rates that cover everything — recruiting, vetting, payroll, taxes, insurance, compliance, and backfill if needed.

- **Standard Labor Rate**: $31.95 per hour straight time, $43.13 overtime
- **Skilled Labor Rate**: $55.04 per hour straight time, $96.32 overtime

These rates give you complete budget certainty. You don't have to negotiate individual worker pay rates with us. Most clients find the time, risk, and hassle we take off their plate is well worth the rate."

### What NOT to say
- Do not mention "bands", "markup", "1.42x", "average pay assumption", or any internal formula.
- Do not volunteer margin information.
- Avoid saying "this is based on your average pay" — it invites comparison.

### Value Stack (use these talking points)
- Faster time-to-fill than doing it yourself
- Full compliance and risk transfer (we handle classification, taxes, workers' comp, unemployment claims)
- Reliable backfill when workers don't show
- Future scheduling tools that help reduce overtime costs
- One invoice, one point of contact

### Negotiation Levers (instead of lowering rates)
- Volume discounts for large commitments
- Long-term contract pricing
- Dedicated recruiter or account manager
- Performance guarantees (e.g. fill rate, retention targets)
- Free scheduling / time-tracking software (future)

This framing keeps the conversation focused on **value and predictability** rather than deconstructing our cost structure. Sophisticated clients may still try to reverse-engineer margins, but we control the narrative by emphasizing the full service we provide.

## Client Communication Framework (Revised for Actual Average Model)

**Goal:** Explain the rate *structure* and benefits transparently while protecting our exact multipliers and internal details until a formal proposal.

### Safe High-Level Explanation (use this early in conversations)

"We group roles into two main categories based on pay range. For each category, we calculate a bill rate using the actual average pay of the workers in that category during the billing period. This gives you predictable pricing per category without having to negotiate every single worker.

The structure is designed so that:
- On more common, lower-wage roles, overtime remains reasonably priced so you don’t have to worry as much about scheduling extra hours.
- On higher-skilled roles, the overtime rate is set higher to encourage better workforce planning and reduce burnout.

This approach, combined with our full-service recruiting, compliance, payroll, insurance, and replacement support, provides simplicity and risk reduction that is difficult to achieve in-house. Once we understand your typical work mix, we can provide specific example rates."

### What NOT to disclose initially
- Specific multipliers (e.g. 1.42x, 1.75x)
- Exact calculation details or band boundaries
- Margin targets or "assumed" vs "actual" language in early discussions

### When to Share Exact Rates & Calculation
- After discovery, in a proposal or rate card.
- Show the final calculated rates for their expected mix.
- Be prepared to walk through a simple example like the one in the "Example: How Average is Calculated per Band" section above.

### Value-First Talking Points (lead with these)
- Predictable budgeting per category of work
- No per-worker rate negotiations
- Full compliance and risk transfer
- Reduced administrative burden
- Better outcomes for workers (less unnecessary overtime on skilled roles)
- Future scheduling tools to optimize costs

This framework allows you to be open about the **structure and benefits** while keeping the proprietary multipliers and exact math for later stages. It aligns with our vision of transparency without giving away the full business model.

---

**Note:** The earlier "Client-Facing Presentation & Rate Cards" section above can be removed or archived once this revised framework feels complete.

---

This pricing strategy directly supports the high-level approach described in `core-business-plan.md`.

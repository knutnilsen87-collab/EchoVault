# EchoVault Licensing Model

## Purpose
Define the MVP license tiers, what the platform sells, and what must be enforced by product and backend.

## Important legal caveat
This document is a product specification, not final legal language. All licensing terms, warranties, limitations, dispute policies and refund rules must be reviewed by qualified counsel before production launch.

## Product positioning
EchoVault sells **licenses to use curated AI/hybrid music tracks** in specified contexts. It does not sell copyright ownership unless a future bespoke enterprise/sync contract explicitly says so.

## License tiers — MVP proposal
| Tier | Proposed price | Buyer type | Allowed use | Main limits |
|---|---:|---|---|---|
| Creator | €19 one-off | Individual creator | 1 monetized YouTube/Twitch/social channel or 1 creator brand | No resale, no stock redistribution, no Content ID registration |
| Pro | €49 one-off | Freelancer / small studio | Up to 5 client projects or channels | No standalone music distribution, no resale, no Content ID |
| Agency | €199 one-off | Agency / SMB team | Commercial use across campaigns for one client/brand | No resale as music library, no Content ID, no transfer outside licensed client/brand |

## Required purchase record
Every purchase must store purchase ID, buyer ID, track ID, artist ID, tier, terms version ID, price paid, currency, artist cut, platform cut, Stripe session ID, purchase timestamp, whitelisted URL/channel/project field if applicable, certificate URL and immutable audit event.

## Certificate contents
Certificate PDF must include EchoVault license ID, buyer name/email or company, track title and track ID, artist name and artist ID, license tier, license terms version, permitted use summary, purchase timestamp, paid amount/currency, certificate verification URL and disclaimer.

## Required disclaimer
“This certificate documents platform license grant and purchase record. It is not a guarantee that third parties will never assert claims.”

## Refund/dispute baseline
- Digital access is delivered instantly after successful payment.
- Refunds require policy decision and legal review.
- If a track becomes disputed, stop new purchases immediately.
- Existing buyers must retain access to historical certificate and purchase record unless legal counsel requires otherwise.

## Evidence labels
- Three-tier pricing: **Observed from founder blueprint, but pricing viability is Speculative**
- Certificate and ledger requirement: **Inferred**
- Disclaimer language: **Inferred; requires legal counsel**

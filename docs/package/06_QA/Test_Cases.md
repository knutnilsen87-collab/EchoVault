# Test Cases

| ID | Scenario | Expected result | Priority |
|---|---|---|---|
| TC-001 | Artist creates track draft | Draft saved with status `draft` | P0 |
| TC-002 | Artist submits without PoE | Submission blocked with validation errors | P0 |
| TC-003 | Artist uploads invalid file | File rejected or quarantined | P0 |
| TC-004 | EchoScore succeeds on fixture | Metrics and score stored | P0 |
| TC-005 | EchoScore fails on corrupt file | Job marked failed; admin can retry | P0 |
| TC-006 | Admin approves valid track | Track becomes live; audit log created | P0 |
| TC-007 | Admin rejects suspicious PoE | Track rejected with reason code | P0 |
| TC-008 | Anonymous user opens catalog | Only approved/live tracks shown | P0 |
| TC-009 | Buyer previews track | Preview plays compressed file | P0 |
| TC-010 | Buyer starts checkout | Stripe session created with metadata | P0 |
| TC-011 | Stripe webhook duplicate event | Only one license created | P0 |
| TC-012 | Buyer downloads high-res file | Signed URL returned; expires | P0 |
| TC-013 | Unauthorized download request | Request denied | P0 |
| TC-014 | Certificate generated | Required fields present | P0 |
| TC-015 | Track suspended | Removed from catalog, old licenses visible | P0 |
| TC-016 | Buyer opens dispute | Dispute linked to license/track | P1 |
| TC-017 | Public copy scan | No “risk-free/safe harbor” overclaim | P0 |
| TC-018 | Keyboard-only checkout | Buyer can complete flow | P1 |

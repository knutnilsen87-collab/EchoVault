# EchoVault Ultra Production Director

Dette dokumentet er laget for å gjøre Codex-arbeidet så lite tolkningsbasert som mulig.

## Produksjonsregel

Codex skal aldri starte med bred refaktor. Hver PR skal være en liten, verifiserbar vertikal forbedring som:

1. berører en tydelig eierflate
2. oppdaterer eller bevarer kontrakter
3. legger til målrettet test/verifikasjon
4. dokumenterer resterende antagelser
5. stopper ved første uavklarte sikkerhets-, lisens- eller betalingsrisiko

## Arbeidsmodus for hver PR

```text
read task packet
inspect allowed files only
write bounded plan
make smallest change
run required checks
write PR notes
stop
```

## Prioritert implementeringsrekkefølge

1. Repo install + typecheck green
2. DB client adapter + env validation
3. Public catalog read path
4. Track detail + license tier selection
5. Checkout session persistence
6. Stripe webhook idempotency
7. Purchase/license record creation
8. Delivery entitlement check
9. Artist upload draft path
10. Proof-of-Effort validation path

## Codex skal ikke gjette på disse

- Stripe produkt/prismodell utover stubben
- endelig juridisk lisensspråk
- endelig EchoScore algoritme
- endelig AI provenance policy
- endelig storage provider
- auth provider implementation

Lag adapter-grense og TODO med `ASSUMPTION:` i stedet.

# Repo Health Gates for Codex

Codex skal svare på disse før hver PR lukkes:

1. Er koden lagt i riktig app/package?
2. Ble canonical domain types gjenbrukt?
3. Ble API envelope bevart?
4. Ble private data skjult fra public route?
5. Ble nye miljøvariabler lagt til `.env.example`?
6. Ble fixtures eller tests oppdatert?
7. Ble noe design-lock dokument endret? Hvis ja: stopp.
8. Finnes det duplisert business logic i route og domain package?
9. Ble databaseendring ledsaget av rollback eller migrasjonsnotat?
10. Kan neste utvikler forstå endringen på under fem minutter?

PR kan ikke markeres klar dersom punkt 1–8 ikke er tilfredsstilt.

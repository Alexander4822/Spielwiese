# Spielwiese – Portfolio CRUD Prototype

Dieses Repo enthält einen lauffähigen Prototypen für:

- serverseitige Create/Update/Delete-Handler je Entität,
- Formularvalidierung für EquityPosition, CryptoPosition, CashAccount, RealEstate und Loan,
- verpflichtende RealEstate-Felder (`segment`, `baselineValue`, `baselineMonth`) inklusive nested `loans[]`,
- modalbasierte UX-Empfehlung mit Fokus auf stabile Full-Submit-Forms,
- CSV-Import als Stub-Endpoint inkl. einfachem Parser.

## Lokale Prüfung

```bash
npm run check
```

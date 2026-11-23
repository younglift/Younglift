# Ekranai: dizainas 07 „Tamsus stiklas“ (telefonas, 390×844)

Nuspręsta 2026-11-23. Pirmiausia skaityk `docs/design/HANDOFF-07.md`.

**Kaip skaityti:** kiekvienas `.dc.html` yra vienas ekranas iš Mato drobės. Viršuje HTML su `{{kintamaisiais}}`, `<sc-if>` (rodyti jei) ir `<sc-for>` (kartoti). Apačioje `class Component` laiko būseną ir logiką. `<dc-import name="03-discover" start-on="2">` reiškia tą patį ekraną kitame žingsnyje.

- Tai **specifikacija, ne kodas kopijuoti**. Statyk Next.js komponentais, stilius imk tik iš `var(--u-*)` (`app/globals.css`). Ekranuose stiliai įrašyti tiesiai tik todėl, kad tai drobė.
- Nuotraukos jau perrašytos į `/img/...` ir `/stickers/...` (yra `public/`). App'e jas imk per `@/lib/data`.
- Klasės ekranuose atitinka tokenus: `.g` = `--u-glass`, `.gs` = `--u-glass-sm`, `.hand` = `--u-hand`, `.cta` = pagrindinis mygtukas, `.m` = `--u-mute`.

| Failas | Ekranas |
|---|---|
| `01-home` | Pradžia: logotipas, motto, „Start exploring“ / „I make things“ |
| `02-taste` | Ką mėgsti? (kategorijos su nuotraukomis, butter pažymėjimas) |
| `03-discover` | Discover: kūrinys + „More from Inez“ (▶ Play: šonu į video ir profilį) |
| `03-discover-video` | Discover 2: jos video |
| `03-discover-profile` | Discover 3: jos profilis (Works · Journal · Reviews, „Next maker“) |
| `03-discover-hints` | Naujiems: nuotrauka po 1 s pati pasislenka ir parodo kito kadro kraštą (prop `hints="1"`) |
| `03-discover-hints-upnext` | Naujiems po pirmo braukimo: „Up next · Mara · swipe up ↑“ |
| `03-discover-surprise` | Netikėtas kūrėjas (už skonio ribų, lipdukas „We think you might like this“) |
| `04-product` | Kūrinys: paruoštas siųsti |
| `04-product-ring` | Kūrinys: su dydžiais (EU) |
| `04-product-sold` | Kūrinys: parduotas (+ panašūs) |
| `05-explore` | Explore: kategorijos + paieška |
| `05-explore-results` | Kategorija (Filter + Sort) |
| `05-explore-filter` | Filtras (apatinis langas) |
| `06-saved` | Saved + lentos |
| `06-following` | Following |
| `06-inbox` | Žinučių sąrašas |
| `06-chat` | Pokalbis |
| `06-chat-offline` | Naujas pokalbis, kūrėja offline |
| `06-custom-request` | Individualus užsakymas: forma |
| `06-custom-request-sent` | Individualus užsakymas: išsiųsta, kas toliau |
| `07-bag` | Krepšelis: pirkti iš kiekvienos kūrėjos, nemokamo siuntimo pagalbininkas, 15 min rezervacija (▶ Play: laikmatis eina) |
| `07-bag-empty` | Tuščias krepšelis |
| `07-checkout` | Checkout |
| `07-thanks` | Ačiū |
| `08-profile` | Tavo profilis + užsakymai |
| `09-stickers` | Lipdukai: kūrėja uždeda / Uplift uždeda |

**Kūrėjo kelias (pirmas variantas, laukia Mato atsiliepimo; logika ir duomenys jau tinka statyti):**

| Failas | Ekranas |
|---|---|
| `10-sell` | B1 · Sell on Uplift |
| `11-apply` | B2 · Paraiška |
| `12-approved` | B3 · Priimta → 4 žingsniai iki „Go live“ |
| `13-studio-profile` | B4 · Profilio redaktorius, 5 žingsniai (▶ Play; prop `startOn` 1–5) |
| `14-studio-add-piece` | B5 · Naujas kūrinys + lipduko pasirinkimas (▶ Play) |
| `15-studio-post` | B6 · Video / Journal / In progress |
| `16-studio-payouts` | B7 · Išmokos per Stripe |
| `17-studio-today` | B8 · Studio: šiandien |
| `18-studio-pieces` | Studio: tavo kūriniai |
| `19-studio-order` | B9 · Užsakymas → išsiųsti |

Seni A1–A12 ekranai (šviesūs ir tamsiai žali): `v1-archive/`. Jų srautai galioja, išvaizda ne.

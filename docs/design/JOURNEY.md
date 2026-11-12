# Dizaino kelias: žingsnis po žingsnio

**Kaip dirbam:** einame keliu taip, kaip jį patiria žmogus, nuo pirmo ekrano iki paskutinio. Kiekvienam žingsniui: 2–3 vizualiniai variantai → Matas renkasi → pažymim ✅ → stilius įrašomas į `app/globals.css`.

**Kas nesikeičia:** kas kur atsidaro ir kokia eilės tvarka (tai paimta iš prototipo).
**Kas keičiasi:** kaip tai atrodo.

Būsenos: ⬜ dar nepradėta · 🟡 daroma · ✅ nuspręsta

---

## 0. Pagrindas (prieš visus ekranus)
| # | Žingsnis | Būsena |
|---|---|---|
| 0.1 | Nuotaika ir kryptis: kaip turi jaustis Young Lift (3 kryptys palyginimui) | ⬜ |
| 0.2 | Spalvos | ⬜ |
| 0.3 | Šriftai | ⬜ |
| 0.4 | Mygtukai, žymos, kortelės, laukeliai | ⬜ |
| 0.5 | Logo naudojimas, viršutinė juosta, apatinė navigacija | ⬜ |

## A. Pirkėjo kelias (nuo pradžios iki pabaigos)
| # | Ekranas | Ką žmogus čia daro | Būsena |
|---|---|---|---|
| A1 | Pirmas atidarymas / Welcome | Supranta, kas tai, ir nori pradėti | ⬜ |
| A2 | Skonio pasirinkimas (3 žingsniai) | Pasirenka, kas jam patinka | ⬜ |
| A3 | **Discover feed** | Scrollina kūrėjus po vieną (širdis) | ⬜ |
| A4 | Kūrėjo pasaulis | Pažįsta kūrėją, mato visus kūrinius | ⬜ |
| A5 | Produktas | Apžiūri kūrinį, renkasi variantą | ⬜ |
| A6 | Explore / paieška | Ieško kažko konkretaus | ⬜ |
| A7 | Saved + lentos („For birthday“) | Išsisaugo idėjas dovanoms | ⬜ |
| A8 | Following | Mato sekamus kūrėjus | ⬜ |
| A9 | Žinutės | Rašo kūrėjui | ⬜ |
| A10 | Krepšelis | Peržiūri, ką perka | ⬜ |
| A11 | Checkout + Ačiū | Sumoka, gauna patvirtinimą | ⬜ |
| A12 | Profilis + užsakymai | Seka užsakymą, keičia skonį | ⬜ |

## B. Pardavėjo (kūrėjo) kelias
| # | Ekranas | Ką kūrėjas čia daro | Būsena |
|---|---|---|---|
| B1 | „Sell on Young Lift“ puslapis | Supranta, kodėl verta prisijungti | ⬜ |
| B2 | Paraiška | Pateikia savo darbus atrankai | ⬜ |
| B3 | Patvirtinta → pirmi žingsniai | Sužino, kad priimtas, ką daryti toliau | ⬜ |
| B4 | Studio: profilio redaktorius | Susikuria savo „pasaulį“ | ⬜ |
| B5 | Pridėti kūrinį | Įkelia nuotraukas, kainą, aprašymą | ⬜ |
| B6 | Įkelti video / postą | Kuria turinį feed'ui | ⬜ |
| B7 | Prijungti išmokas (Stripe) | Nurodo, kur gauti pinigus | ⬜ |
| B8 | Dashboard | Mato pardavimus | ⬜ |
| B9 | Užsakymas → išsiųsti | Supakuoja, pažymi „išsiųsta“ | ⬜ |

## C. Bendri dalykai
| # | Ekranas | Būsena |
|---|---|---|
| C1 | Prisijungimas / registracija | ⬜ |
| C2 | El. laiškai (užsakymas, išsiųsta) | ⬜ |
| C3 | Tušti ekranai, klaidos, kraunasi | ⬜ |
| C4 | Teisiniai puslapiai, footer | ⬜ |

---

## Sprendimų žurnalas
*(čia rašom, ką nusprendėm, kad abiejų AI žinotų)*

- 2026-11-12: Srautai užrakinti, vizualas atviras. Pradedam nuo 0.1.

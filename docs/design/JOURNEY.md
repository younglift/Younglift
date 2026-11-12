# Dizaino kelias: žingsnis po žingsnio

**Kaip dirbam:** einame keliu taip, kaip jį patiria žmogus, nuo pirmo ekrano iki paskutinio. Kiekvienam žingsniui: 2–3 vizualiniai variantai → Matas renkasi → pažymim ✅ → stilius įrašomas į `app/globals.css`.

**Kas nesikeičia:** kas kur atsidaro ir kokia eilės tvarka (tai paimta iš prototipo).
**Kas keičiasi:** kaip tai atrodo.

Būsenos: ⬜ dar nepradėta · 🟡 daroma · ✅ nuspręsta

---

## 0. Pagrindas (prieš visus ekranus)
| # | Žingsnis | Būsena |
|---|---|---|
| 0.1 | Nuotaika ir kryptis: kaip turi jaustis Young Lift (3 kryptys palyginimui) | ✅ |
| 0.2 | Spalvos | ⬜ |
| 0.3 | Šriftai | ⬜ |
| 0.4 | Mygtukai, žymos, kortelės, laukeliai | ⬜ |
| 0.5 | Logo naudojimas, viršutinė juosta, apatinė navigacija | ⬜ |

## A. Pirkėjo kelias (nuo pradžios iki pabaigos)
| # | Ekranas | Ką žmogus čia daro | Būsena |
|---|---|---|---|
| A1 | Pirmas atidarymas / Welcome | Supranta, kas tai, ir nori pradėti | ⬜ |
| A2 | Skonio pasirinkimas (3 žingsniai) | Pasirenka, kas jam patinka | ⬜ |
| A3 | **Discover feed** | Scrollina kūrėjus po vieną (širdis) | ✅ |
| A4 | Kūrėjo pasaulis | Pažįsta kūrėją, mato visus kūrinius | ✅ |
| A5 | Produktas | Apžiūri kūrinį, renkasi variantą | 🟡 |
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
- 2026-11-12: Dizainą darom **pirma telefonui**, kompiuterio versiją po to.
- 2026-11-12: Nuotaika: pasirinkta **A kryptis** (pop-up / plakatas: juodas fonas, Anton, žalia akcentui), bet **be „drop ends“ laikmačio**. B (galerija) ir C (iškirpta) atmesti.
- 2026-11-12: Discover kūrėjo kortelė (srautas kaip prototipe): 1 kadras = kūrėjo įkelta nuotrauka (vienas ar keli kūriniai) su **suskleistais taškiukais**; paspaudus taškiuką išsiskleidžia pavadinimas + kaina, paspaudus juos atsidaro produktas. Braukiant į šoną: kūrėjo istorija / video ir t.t. „Explore her studio“ veda tiesiai į kūrėjo pasaulį.
- 2026-11-12: Discover kortelė: 3 kadrai (1 darbai su taškiukais → 2 jos istorija/video → 3 daugiau kūrinių). Apačia vienoda visuose: avataras, VARDAS, miestas · amatas, „+ Follow“ tekstu, ❤️ be rėmelio, citata, vienas žalias mygtukas „Explore her studio →“. Be logo viršuje scrollinant. Navigacija paprastomis raidėmis.
- 2026-11-12: Kainų taškiukai ir burbuliukai **stiklo (iOS glass) stiliaus**: apvalūs, permatomi su blur, tamsus tekstas.
- 2026-11-12: **Kaina rašoma su euro ženklu po skaičiaus: `78 €`, `120 €`** (ne „€ 78“ ir ne „EUR 78“). Justinai: `lib/format.ts` `formatEUR` turi grąžinti tokį formatą.
- 2026-11-12: **Kūrinių tinklelis (visur, kur rodomi keli kūriniai)**, kaip Zalando: 2 stulpeliai, dideli tarpai (32px tarp eilučių, 12px tarp stulpelių), nuotrauka 4:5, išsaugojimo ženkliukas (bookmark) stikliniame apskritime viršuje dešinėje. Po nuotrauka: pavadinimas (paryškintas), viena trumpa eilutė (medžiaga), **kaina atskiroje eilutėje apačioje**. Parduoti kūriniai lieka pilki su „SOLD“.
- 2026-11-12: **Kūrėjo žymė ant nuotraukos (neprivaloma):** kūrėjas gali pridėti vieną trumpą užrašą prie kūrinio (pvz. „1 OF 1“, „SPECIAL WAX USED“), rodoma apačioje kairėje. Daugiausia 1 žymė kūriniui, iki ~20 simbolių, ne ant visų. Justinai: `products` reikės lauko `label text` (nullable), Studio formoje laukelis.
- 2026-11-12: **Kūrėją seki (Follow), kūrinį išsaugai (bookmark ženkliukas).** Kūrėjo kortelėje širdutės nėra, tik „+ Follow“. Ant kūrinių vietoj širdutės: išsaugojimo ženkliukas (kaip Instagram „Save“), jis deda į Saved ir lentas. Širdutės platformoje nenaudojam.
- 2026-11-12: **„X looking now“ žymė** kūrėjo kortelės viršuje kairėje (maža, stiklinė, su žaliu tašku). Rodoma **tik pirmame kadre** ir **tik kai kūrėją tuo metu žiūri daugiau nei 50 žmonių**, kitaip jos nėra. Skaičius turi būti tikras (ES draudžia netikrą „social proof“). Justinai: reikės realaus laiko skaičiavimo, pvz. Supabase Realtime Presence pagal kūrėją.
- 2026-11-12: **Kūrėjo pasaulis (A4): su skirtukais Pieces / Journal / About** (žmogus pats renkasi, ką žiūri, nereikia scrollinti iki apačios). Viršuje: nuotrauka → vardas, aprašymas, faktai, Follow/Message → horizontali video/nuotraukų juosta → skirtukai. Pieces: filtrai + tinklelis + „Want something personal?“ (šviesiai žalia #4fe061, juodas tekstas).
- 2026-11-12: **Journal = kūrėjo įrašai, ne Instagram.** Maišom du tipus: įrašas su nuotrauka (data · tipas, pavadinimas, 1–2 sakiniai, pvz. „New glaze method unlocked“) ir užrašų kortelė be nuotraukos (pvz. SKETCHBOOK citata dideliu šriftu, NEXT IDEA). Tipai: DISCOVERED / PROCESS / SKETCHBOOK / NEXT IDEA. Rodom tik kelis naujausius.
- 2026-11-12: **Skirtukai (tabs):** pasirinktas rodomas dideliu Anton šriftu didžiosiomis raidėmis (PIECES), kiti mažais pilkais (Journal, About). Be žalio pabraukimo.
- 2026-11-12: **Video/nuotraukų juosta rodoma tik Pieces skirtuke** (ne Journal ir ne About). Skirtukai eina iškart po Follow/Message.

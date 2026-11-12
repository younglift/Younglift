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
| A5 | Produktas | Apžiūri kūrinį, renkasi variantą | ✅ |
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

## Navigacijos taisyklės (privaloma abiem AI)
1. **Atgal = visada vienas žingsnis atgal.** Niekada nešokinėti per kelis ekranus.
2. **Atgal mygtukas sako, kur veda:** „‹ Discover“, „‹ Mara“, „‹ Saved“ ir t.t.
3. **Paspaudus aktyvų skirtuką apatinėje navigacijoje (pvz. Discover), grįžtama į to skirtuko pradžią,** o Discover atveju į **tą patį kūrėją ir tą patį kadrą**, kur žmogus buvo.
4. **Feed prisimena vietą:** grįžus iš kūrėjo ar produkto, žmogus yra ten pat, ne sąrašo viršuje.
5. **Produktas = pilnas ekranas** (ne bottom sheet). Turi savo nuorodą (URL), kad kūrėjai galėtų dalintis.
6. Jei kada naudosim sheet: matomas ✕, telefono „atgal“ gestas jį uždaro, sheetų vienas ant kito nekraunam.

## Atviri UX klausimai (dar padaryti)
- Pasitikėjimas: ženklas „Approved by Young Lift“ (atranka), saugus mokėjimas, grąžinimai.
- ES DSA: prekyvietė turi rodyti pardavėjo (verslo) duomenis kūrėjo puslapyje. Pasitikrinti su teisininku.
- Klaidų / tuščios / kraunasi būsenos (C3), **vėliau**.

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
- 2026-11-12: Produktas lieka pilnu ekranu. Atgal mygtukas su vardu („‹ Mara“). Neaktyvūs navigacijos punktai #8b8a85 (kontrastas).
- 2026-11-12: **Pirmo karto užuominos** (rodomos tik vieną kartą, naujam žmogui): ekranas pritemsta, taškiukai 3 kartus švelniai pulsuoja, stikliniai burbuliukai „Tap a dot to see the name and price“, „Tap the sides for her story and more pieces“, „↑ Swipe up for the next maker“, mygtukas „Got it“ (paspaudus bet kur užsidaro).
- 2026-11-12: **Tamsus stiklas** burbuliukams ant tamsių nuotraukų: rgba(18,20,18,.48) + blur, baltas tekstas. Kodas parenka šviesų ar tamsų pagal nuotraukos šviesumą (arba kūrėjas pasirenka įkeldamas).
- 2026-11-12: **Video subtitrai** įjungti pagal nutylėjimą (balti ant pusiau juodo fono, centre apačioje), „CC“ mygtukas viršuje dešinėje juos išjungia. Kūrėjas įkeldamas video turi pridėti subtitrus (arba sugeneruojam automatiškai).
- 2026-11-12: **Produkto būsenos:** (1) paruoštas siųsti: kaina + „+ 4,90 € shipping to Lithuania · 82,90 € total“ iškart po kaina; (2) **dydžiai** (žiedai): EU dydžių mygtukai, išparduotas perbrauktas, kol nepasirinktas dydis mygtukas „CHOOSE A SIZE“ pilkas, pasirinkus tampa „ADD TO BAG“; „Not sure? Ask Inez“; (3) **parduotas**: pilka kaina, „This piece has found a home“, apačioje „ASK FOR SOMETHING SIMILAR“. Gamina pagal užsakymą: oranžinis taškas „Made to order · ready in 1–2 weeks“.
- 2026-11-12: **Produkto info kaip Zalando (aiški šriftų hierarchija):** kūrėjo vardas didelis pabrauktas (nuoroda), pavadinimas didelis, **kaina didžiausia** (be „incl. VAT“ užrašo; kainos visada galutinės su PVM, užrašas tik checkout), po ja mažai pilkai „+ pristatymas · total“; „Material: **…**“; būsena **apibrėžtoje dėžutėje** (1px rėmelis, 10px apvalinimas): ● Ready to ship / Made to order / This piece has found a home + paaiškinimas; dydžiai atskiroje apibrėžtoje dėžutėje „Size: Choose your size“ (kol nepasirinkta, rėmelis šviesus); „About this piece“ su istorija; „Ask … a question“ rėmelyje.

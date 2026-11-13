# Young Lift: planas dviem

**Tikslas:** per 2 savaites (iki ~lapkričio 26 d.) veikianti svetainė, kurioje žmonės scrollina kūrėjus, juos seka, išsisaugo ir perka.

**Principas:** dirbame lygiagrečiai ir vienas kitam nekliudome. Justinas daro **„variklį“** (duomenis, pinigus), Matas daro **„ką žmogus mato“** (ekranus) ir **kūrėjus**.

---

## Kas ką daro

### Justinas: variklis
1. Next.js projekto pamatas ir deploy į Vercel (**pirma diena, kad Matas galėtų pradėti**)
2. Supabase: duomenų bazė, registracija ir prisijungimas, nuotraukų saugykla
3. Stripe Connect: krepšelis, apmokėjimas, komisinis, išmokos kūrėjams
4. Užsakymai ir el. laiškai (Resend)
5. Admin: kūrėjų paraiškų priėmimas / atmetimas

### Matas: ką žmogus mato + kūrėjai
1. Perkelti prototipo ekranus į Next.js: Discover feed, kūrėjo puslapis, produktas, paieška, Saved ir lentos, profilis, skonio pasirinkimas
2. Kūrėjo Studio: profilio redaktorius, kūrinių įkėlimas
3. **Surinkti 15–20 kūrėjų** su tikromis nuotraukomis ir tekstais (svarbiausia: be jų svetainė tuščia)
4. Teisiniai tekstai: taisyklės, privatumas, grąžinimai

---

## Dizaino etapas (pirmos ~3 dienos, Matas)
Išvaizdą perdarom žingsnis po žingsnio: pirma pirkėjo kelias, tada pardavėjo. Kas kur atsidaro, nesikeičia. Visa eiga aprašyta `docs/design/JOURNEY.md`. Tuo metu Justinas daro variklį, tad laiko neprarandam.

## Savaitės

| | Justinas | Matas |
|---|---|---|
| **1 d.** | Pamatas + netikri duomenys, kad Matas galėtų dirbti | Kūrėjų paieška, nuotraukos |
| **2–5 d.** | Duomenų bazė, prisijungimas | Discover, kūrėjo puslapis, produktas |
| **6–7 d.** | Netikrus duomenis pakeičia tikrais | Paieška, Saved, lentos, skonio setup |
| **8–10 d.** | Stripe, krepšelis, checkout | Studio (profilis, kūriniai) |
| **11–12 d.** | Užsakymai, laiškai, admin | Kūrėjų įkėlimas, teisiniai tekstai |
| **13 d.** | Testuojam kartu telefonuose | |
| **14 d.** | 🚀 Paleidimas | |

---

## Kaip dirbam kasdien

1. **Ryte 10 min skambutis:** ką vakar padarei, ką šiandien darysi, kas stabdo.
2. **Kiekvienas darbas daromas savo šakoje,** pvz. `matas/discover`, `justinas/stripe`.
3. **Baigei, tai atidaryk Pull Request.** Kitas atsidaro Vercel peržiūros nuorodą, paspaudinėja ir patvirtina.
4. **Merge į `main`.** Svetainė atsinaujina pati.
5. **Mažais gabalais:** geriau 2 maži PR per dieną nei vienas didelis per savaitę.

**Svarbiausia taisyklė:** nekeiskite kito žmogaus failų. Jei reikia, parašykite jam.

---

## Ką reikia nuspręsti šią savaitę
- [ ] Komisinis: ___ %
- [ ] Siuntimas: kūrėjas nustato pats ar fiksuota kaina?
- [ ] Įmonė Stripe'ui (MB / UAB)
- [ ] Paskyros: Supabase, Stripe, Resend (Vercel jau yra)

---

## Kiekvieno AI
Kiekvienas, pradėdamas darbą su savo Claude, tegul parašo:
> Perskaityk `CLAUDE.md` ir `docs/ai/justinas.md` (arba `docs/ai/matas.md`)

Ten viskas, ką jūsų AI reikia žinoti.

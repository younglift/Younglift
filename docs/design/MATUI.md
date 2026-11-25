# Matui: ką reikia padaryti (2026-11-24)

Visas 07 dizainas jau įdėtas į app'ą ir veikia `main` šakoje (https://younglift-delta.vercel.app). Visi mygtukai veikia su bandomaisiais duomenimis. Prašom pereiti ir pažiūrėti telefone ir kompe.

## 1. Patikrink, ar sudėta pagal tavo dizainą
- Pereik pirkėjo kelią (`/welcome` → Discover → kūrinys → krepšelis → checkout) ir kūrėjo kelią (`/sell` → paraiška → `/admin` → Approve → Studio).
- Ką reikia pataisyti, rašyk čia arba Justinui: ekranas + kas ne taip.
- Patvirtink, kad kūrėjo pusės (Studio) išvaizda tinka. Dabar tai tavo „pirmas variantas“.

## 2. Ką pridėjau ne iš tavo dizaino (nuspręsk: palikti ar perpiešti)
- **Telefone apvalus „L“ mygtukas viršuje dešinėje** (Explore, Saved, Following, Bag). Tavo apatinėje navigacijoje nėra kelio į profilį ir užsakymus.
- **Naujas tekstas netikėtai kūrėjai:** „Outside what you picked. Something new we think you might like.“ (be „people who love Inez also follow Mara“, nes tokių duomenų neturim).
- **Nauji tokenai** `app/globals.css` (laukai, perjungikliai, šešėliai): `--u-field`, `--u-field-border`, `--u-focus`, `--u-track`, `--u-shade`, `--u-scrim-bottom`, `--u-online`, `--u-accent-soft`, `--u-sticker-shadow`. Reikšmės paimtos iš tavo ekranų, keisk laisvai.
- **Ekranai, kurių nebuvo:** dydžių gidas, privatus listingas po individualaus užsakymo, Studio žinutės (pokalbiai / užklausos / atsiliepimai), adresai, pranešimai, grąžinimas, `/admin`, 404 ir klaidos puslapis, krovimo taškelis. Visi pagal tavo stilių, bet nepiešti.

- **Kompo Discover (Justino prašymu, 2026-11-25):** puslapis slenka laisvai kaip įprastoje parduotuvėje (pelė, touchpad, klavišai), be prisitraukimo prie kūrėjo; vienas kūrėjas = vieno ekrano aukštis. Nebėra „Next maker“ mygtuko ir kūrėjų eilės apačioje. P7 sako „Wheel = next maker (as now)“: daryk P7 su laisvu slinkimu arba susitark su Justinu.

## 3. Ko reikia iš tavęs (nupiešti)
- **C1–C4:** prisijungimas, tušti ekranai ir klaidos, teisiniai puslapiai (taisyklės, privatumas, grąžinimas, slapukai).
- **Admin:** paraiškų peržiūra.
- **„Made in …“ lipdukai kitiems miestams.** Dabar yra tik `made-in-berlin.png`. Reikia bent Vilnius, Kaunas, Riga, Tallinn, Warsaw. Failo vardas `made-in-<miestas>.png`, kodo keisti nereikės.
- **Kompiuterio Studio:** paraiškos ir Sell ekranai naudoja telefono išdėstymą per vidurį. Jei nori kitaip, nupiešk.

## 4. Sprendimai abiem
- Komisinis % (ekrane pavyzdys su 10%).
- Siuntimo kainos pagal šalis ir kurie paštomatai.
- MB ar UAB.
- Tikros kūrėjos ir jų nuotraukos vietoj Inez, Mara, Ula, Ona.

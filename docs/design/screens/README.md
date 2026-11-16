# Ekranų dizainas (telefonas, 390×844)

Šaltinis: Mato dizaino drobė Claude'e („Uplift: nuotaikos kryptys“). Čia **kopija skaitymui**, kad Justinas ir jo AI matytų tikslią struktūrą, tekstus, spalvas ir elgseną.

**Kaip skaityti:** kiekvienas `.dc.html` = vienas ekranas. Viršuje HTML su `{{kintamaisiais}}`, `<sc-if>` (rodyti jei), `<sc-for>` (kartoti sąraše). Apačioje `class Component` = būsena ir logika (kas vyksta paspaudus). Failai su `<dc-import name="X" ...>` yra to paties ekrano X kita būsena (pvz. `Product-Ring` = `Product` su `variant="ring"`).

**Svarbu:**
- Tai **specifikacija, ne kodas kopijuoti**. Programėlėje viską statyk Next.js komponentais, spalvas / šriftus / apvalinimus imk tik iš tokenų `app/globals.css` (žr. CLAUDE.md).
- Nuotraukų adresai `/_blob/...` veikia tik drobėje. Programėlėje naudok `@/lib/data` nuotraukas.
- Kodėl padaryta būtent taip ir ko reikia backend'ui (lentelės, laukai): `docs/design/JOURNEY.md` → Sprendimų žurnalas. Ten pažymėta „Justinai:“.
- Interaktyvią drobę Matas gali pasidalinti per Share.

| Failas | Ekranas |
|---|---|
| `Main.dc.html` | 1/3 Darbai (spausk ▶ Play: veikia visa kortelė) |
| `A2-Video.dc.html` | 2/3 Jos istorija (video + subtitrai) |
| `A3-Daugiau.dc.html` | 3/3 Daugiau kūrinių |
| `Maker.dc.html` | A4 · Kūrėjo pasaulis (spausk ▶ Play) |
| `Product.dc.html` | A5 · Produktas: paruoštas siųsti |
| `Product-Ring.dc.html` | A5 · Produktas: žiedas su dydžiais |
| `Product-Sold.dc.html` | A5 · Produktas: parduotas |
| `Welcome.dc.html` | A1–A2 · Pirmas atidarymas + skonis (spausk ▶ Play) |
| `Hints.dc.html` | Tada: judančios užuominos pirmame Discover (spausk ▶ Play) |
| `DarkTags.dc.html` | Tamsūs stikliniai burbuliukai (tamsioms nuotraukoms) |
| `Explore.dc.html` | A6 · Explore: pradžia (kategorijos + paieška) |
| `ExploreResults.dc.html` | A6 · Explore: kategorija (Filter + Sort) |
| `ExploreFilter.dc.html` | A6 · Explore: Filter langas |
| `Surprise.dc.html` | Discover: netikėtas kūrėjas (kas ~5–10 kortelių) |
| `Saved.dc.html` | A7 · Saved + lentos (spausk ▶ Play, bakstelk išsaugojimo ženkliuką) |
| `Following.dc.html` | A8 · Following (spausk ▶ Play) |
| `Messages.dc.html` | A9 · Žinutės: sąrašas (spausk ▶ Play) |
| `MessagesChat.dc.html` | A9 · Pokalbis (● Active now + greiti klausimai) |
| `MessagesRequest.dc.html` | A9 · Individualus užsakymas |
| `ReplyD.dc.html` | A9 · Naujas pokalbis: „Inez usually replies within a day“ (dingsta po pirmos žinutės) |
| `MessagesOffline.dc.html` | A9 · Pokalbis, kai kūrėja Offline (pilkas taškas) |
| `Bag.dc.html` | A10 · Krepšelis (spausk ▶ Play: −/+, Remove, Save for later, Undo) |
| `BagEmpty.dc.html` | A10 · Tuščias krepšelis |
| `BagSingle.dc.html` | A10 · Krepšelis: vieno kūrėjo kūriniai |
| `Checkout.dc.html` | A11 · Checkout (spausk ▶ Play, slink žemyn; PAY be el. pašto parodo klaidą) |
| `CheckoutDone.dc.html` | A11 · Ačiū (užsakymas priimtas) |
| `Profile.dc.html` | A12 · Profilis + užsakymai (spausk ▶ Play, palik atsiliepimą Ulai) |

Atnaujinta: 2026-11-16. Kai Matas pakeis dizainą, šie failai atnaujinami iš drobės.

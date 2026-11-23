# Perdavimas Justinui: pirkėjo kelias, dizainas 07 „Tamsus stiklas“

Matas, 2026-11-23. **Pirkėjo kelio išvaizda nuspręsta.** Galima statyti į app'ą ir leisti į Vercel. **Kūrėjo kelias B1–B9** jau nupieštas tuo pačiu stiliumi (ekranai `10-`–`19-`). Tai pirmas variantas: Matas dar gali keisti išvaizdą, bet ekranų eiliškumas ir duomenys tinka statyti.

## Kur kas
| Kas | Kur |
|---|---|
| Ekranai (specifikacija, 390×844) | `docs/design/screens/` (sąrašas ir kaip skaityti: README ten) |
| Interaktyvi drobė | Matas pasidalina nuoroda per Share („Uplift · galutinis dizainas (07)“) |
| Tokenai (spalvos, stiklas, šriftai, apvalinimai) | `app/globals.css`, blokas `--u-*` |
| Nuotraukos mock duomenims | `public/img/` (12 naujų Higgsfield nuotraukų + senos) |
| Lipdukai (permatomi PNG su logotipu) | `public/stickers/` |
| Logotipas | `public/brand/` (tamsiame fone `uplift-logo-white.svg`, niekada neperpiešti) |
| Kodėl taip ir ko reikia backend'ui | `docs/design/JOURNEY.md`, eilutės su „Justinai:“ |

## Kompiuteris
Ekranai `docs/design/screens/desktop/` (1440×900). Telefone ir kompiuteryje tie patys komponentai ir tokenai, skiriasi tik išdėstymas (riba 820 px). Kompiuteryje: viršutinė stiklinė juosta vietoj apatinės navigacijos, kūrinys kaip langas (modal), krepšelis kaip stalčius, Studio su kairiu meniu ir gyva peržiūra. Klaviatūra Discover'e: ← → nuotraukos, ↓ kita kūrėja.

## Išvaizda trumpai
- Kiekvieno ekrano fonas `--u-bg` + to ekrano kūrinio nuotrauka, labai išblukinta (`--u-wash-*`). Ant viršaus stiklinės kortelės (`--u-glass`).
- Tekstas kreminis `--u-ink`, antrinis `--u-mute`. **Vienintelis akcentas** butter `--u-accent` (pažymėta, aktyvus taškas nav'e, progresas). Daugiau spalvų nėra, išskyrus lipdukus.
- Šriftai: **Rock Salt** (`--u-hand`: kūrėjų vardai, kūrinių pavadinimai, ekranų antraštės) ir **Inter** (`--u-ui`: visa kita). **Reikia pridėti** per Fontsource (`@fontsource/rock-salt`, `@fontsource/inter`) `app/layout.tsx`, kaip dabar Anton ir Archivo.
- Pagrindinis mygtukas: kreminė pill, 48 px, su kietu 3 px `--u-cta-edge` kraštu apačioje; paspaudus nusileidžia 3 px (`translateY(3px)`, šešėlis dingsta). Antrinis: mažas stiklas.
- Viršutinė juosta ant nuotraukų: visada `--u-scrim-top` gradientas, kitaip balta nuotrauka ją „suvalgo“.
- Apatinė navigacija: stiklinė pill virš turinio, aktyvus punktas su butter tašku po juo.
- Visi paspaudžiami ≥ 44 px. Spalvų / šriftų / apvalinimų **nekoduoti** komponentuose, tik `var(--u-*)`.

## Ekranai → maršrutai (pasiūlymas)
| Ekranas | Failas | Maršrutas |
|---|---|---|
| Pradžia | `01-home` | `/` (neprisijungusiam, pirmas kartas) |
| Ką mėgsti? | `02-taste` | `/welcome/taste` |
| Discover: kūrinys → video → profilis | `03-discover*` | `/` (feed) |
| Kūrinys: paruoštas / žiedas su dydžiais / parduotas | `04-product*` | `/p/[id]` |
| Explore / kategorija / filtras | `05-explore*` | `/explore`, `/explore/[category]` (filtras = apatinis langas) |
| Saved + lentos, Following, Žinutės, Pokalbis | `06-*` | `/saved`, `/following`, `/messages`, `/messages/[id]` |
| Krepšelis / tuščias / checkout / ačiū | `07-*` | `/bag`, `/checkout`, `/checkout/done` |
| Tavo profilis + užsakymai | `08-profile` | `/account` |
| Lipdukai | `09-stickers` | (ne ekranas, komponentas `Sticker`) |
| Individualus užsakymas | `06-custom-request*` | `/m/[maker]/request` |
| Sell on Uplift, paraiška | `10-sell`, `11-apply` | `/sell`, `/sell/apply` |
| Priimta → žingsniai | `12-approved` | `/studio/welcome` |
| Studio | `13-`–`19-` | `/studio` (Today), `/studio/profile`, `/studio/pieces`, `/studio/pieces/new`, `/studio/post`, `/studio/payouts`, `/studio/orders/[id]` |

## Srautų pakeitimai, kuriems reikia tavo OK
Pagal `CLAUDE.md` srautai užrakinti, todėl šitie du laukia tavęs:
1. **Discover šonu: kūrinys → jos video → jos pilnas profilis** (Works · Journal · Reviews). Anksčiau 3-ias žingsnis buvo „Daugiau kūrinių“. Žemyn = kita kūrėja, kaip buvo.
2. **Krepšelis: „pirkti iš kiekvienos kūrėjos“** (atskiras siuntinys ir mygtukas kiekvienai) + apačioje „Pay for all“, nemokamo siuntimo pagalbininkas („38€ to go“), **15 min rezervacija tik vienetiniams**.

## Ko reikia backend'ui
- **15 min rezervacija (tikra, ne netikras laikmatis; ES draudžia netikrus):** lentelė `cart_holds (piece_id, cart_id, expires_at)`. `expires_at = now() + 15 min`, kai vienetinis kūrinys įdedamas į krepšelį. Kol galioja, kitiems kūrinys rodomas „In someone’s bag“ ir jo negalima įdėti. Pasibaigus atlaisvinam. Laikmatis ekrane skaičiuoja nuo `expires_at`.
- **Nemokamas siuntimas nuo X:** kūrėjai laukas `free_shipping_from_cents` (gali būti tuščias).
- **Mokėjimai:** jau suplanuota viena PaymentIntent kiekvienai kūrėjai, tinka. „Pay for all“ = viena Checkout sesija su keliais mokėjimais.
- **Lipdukai:**
  - *kūrėja pasirenka* (ne daugiau kaip 1 kūriniui): `product.maker_sticker` ∈ `one_of_one | handmade | small_batch | made_in_city | made_in_collab | made_to_order`, plius `collab_maker_id` (jei collab) ir `batch_size` (jei small batch). „Made in …“ miestas imamas iš kūrėjos profilio.
  - *Uplift uždeda automatiškai*, tik kai tiesa: `new_maker` (pirmos 30 d.), `just_dropped` (pirmos 7 d.), `last_one_left` (liko tikrai 1 iš kelių), `back_in_stock` (kiekis vėl > 0), `in_progress` (kūrėja pažymėjo, kad gamina), `you_might_like` (tik Discover, kai feed'as įmeta už skonio ribų). Skaičiuoti serveryje iš duomenų, nesaugoti ranka.
  - Ant vieno kūrinio daugiausia 1 kūrėjos + 1 Uplift lipdukas, ir ne ant kiekvieno.
- **Kūrėjos profilis:** reikia `cover_url` (atskiras nuo avataro), Journal įrašų (`posts` jau yra) ir atsiliepimų (`reviews`: order_item_id, rating, text). Atsiliepimų lentelės dar nėra.

## Kūrėjo kelias: ko reikia backend'ui
- `makers.status`: `applied → approved → live`. Patvirtinta kūrėja mato Studio, bet profilis paslėptas, kol pati nepaspaudžia „Go live“ (reikia bent profilio ir 3 kūrinių).
- `maker_applications`: vardas, el. paštas, miestas, šalis, Instagram / svetainė, kategorijos, aprašymas, 3–10 nuotraukų, varnelė „viską darau pati“. Atsakom per 3 dienas (admin'e approve / reject + el. laiškas).
- Profilio redaktorius (5 žingsniai kaip prototipe): `makers.collage` (3 kūriniai), `makers.slide_order`, video su subtitrais, `custom_requests_open`, `gift_wrap` (kaina, aprašymas), `free_shipping_from_cents`.
- Kūrinys: nuotraukos (iki 8, pirma = viršelis), kaina, kategorija, aprašymas, medžiagos, `made_to_order` arba `ready`, kiekis, `ships_within_days`, dydžiai, `maker_sticker` (+ `batch_size`, `collab_maker_id`). „1 of 1“ leidžiam tik kai kiekis 1.
- Įrašai: `posts.kind` = `video | journal | in_progress`, `post_products` (kokie kūriniai video). „In progress“ įrašas uždeda Uplift lipduką „In progress“ ant susieto kūrinio.
- Užsakymas: `ship_by`, `tracking_number`, dovanų kortelės tekstas, mygtukas „Mark as shipped“ (`markShipped(orderId, tracking?)`).
- Išmokos: Stripe Connect Express. **Komisinis % dar nenuspręstas**, ekrane pavyzdys su 10%.
- Studio statistika: peržiūros, išsaugojimai, sekėjai (savaitės pokytis), pardavimai per mėnesį.

## Tekstai
Motto: **„A community of upcoming makers“** (ne „young“). Mygtukai sakiniu, veiksmažodžiu („Add to bag“, „Start exploring“). Programėlės kalba EN.

## Ko dar nėra
Bendri ekranai C1–C4 (prisijungimas, el. laiškai, tušti ekranai ir klaidos, teisiniai puslapiai). Admin (paraiškų peržiūra).

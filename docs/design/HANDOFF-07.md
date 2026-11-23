# Perdavimas Justinui: pirkėjo kelias, dizainas 07 „Tamsus stiklas“

Matas, 2026-11-23. **Pirkėjo kelio išvaizda nuspręsta.** Galima statyti į app'ą ir leisti į Vercel. Kūrėjo kelią (Sell on Uplift, paraiška, Studio, kūrinio įkėlimas, išmokos) projektuojam toliau. Jis ateis atskiru perdavimu.

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

## Tekstai
Motto: **„A community of upcoming makers“** (ne „young“). Mygtukai sakiniu, veiksmažodžiu („Add to bag“, „Start exploring“). Programėlės kalba EN.

## Ko dar nėra (ateis vėliau)
Užuominos pirmame Discover (Hints), Offline pokalbis, individualus užsakymas, „netikėtas kūrėjas“ kortelė (seni variantai `screens/v1-archive/`, srautas tas pats, išvaizdą perpiešiam). Visas kūrėjo kelias B1–B9.

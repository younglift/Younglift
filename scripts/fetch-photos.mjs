// Downloads the new Higgsfield photos (2026-11-25, Matas) into public/img/ at 1200px wide, then run
//   node scripts/optimize-images.cjs   to make the /t/ and /w/ copies.
// Usage: node scripts/fetch-photos.mjs   (needs sharp: npm i -D sharp, and network)
import fs from 'node:fs';
import sharp from 'sharp';
const B = 'https://d8j0ntlcm91z4.cloudfront.net/user_3I4vl7UFNvcvNOyoNZvB1sIC5c7/hf_20261125_';
const PHOTOS = {
  'pink-necklace': '095504_46161144-e583-4369-8544-eadfcb583f1c',      // replaces the 335px one
  'pink-necklace-worn': '095505_e3c79b1e-7710-46b1-9873-a92bf19b6078',
  'earrings-worn': '095605_f2c3bfe9-4c3f-4b7d-a966-64804cc6d26a',
  'fold-ring-hand': '095505_5e205ecd-7f0e-44cb-8c1e-9067d37333a8',
  'soft-loop-hand': '095502_1c957bfd-6c38-403d-a34b-661b253f2a3b',
  'bracelet-worn': '095606_d959deba-9388-416b-92ed-8f3e31e2fc65',
  'flow-ring-wax': '095501_f80148e1-e158-44d4-a11c-6dea3082e442',
  'morning-cup': '095504_6bd86beb-347f-479e-b898-a3fadf6b44b9',        // replaces the 406px one
  'morning-cup-hands': '095607_4432b520-3f9f-40bb-902a-6a9c78606a7c',
  'twist-vase': '095501_6cb1c71f-8767-418a-8f53-1084d540ba94',         // replaces the 440px one
  'plates-detail': '095500_94c5058d-d64a-4632-8a3a-d3327d1d1031',
  'ula': '095606_e18dbe2b-5baf-4f61-acc4-f3184c24c9d7',                // Ula's own portrait
  'flower-hood': '095608_5b03a437-7b6e-4b9f-b61e-981f059f66c0',        // replaces the 472px one
  'crochet-details': '095606_744d907c-7b86-4d06-808d-9aee846c8241',    // replaces the 390px one
  'cardigan-detail': '095612_be944871-8f23-46c8-9bf4-eecc275501fb',
  'wallet-stitching': '095607_841440c8-1dd0-465b-8a2e-fad2940fcbfd',
  'ona': '095654_febd501f-01c3-4450-a83e-550602ce787b',                // Ona's own portrait (was Inez's photo)
  'studio-table': '095652_d9998ee9-ad85-4973-80b4-f6e4a49e7a71',       // replaces the 752px one
  'print-detail': '095652_e50a32f0-2958-43c8-a302-99586ef41ed8',
};
for (const [name, id] of Object.entries(PHOTOS)) {
  const res = await fetch(`${B}${id}.jpeg`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize({ width: 1200 }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/img/${name}.jpg`);
  console.log('ok', name);
}
console.log(`done: ${Object.keys(PHOTOS).length} photos. Now run: node scripts/optimize-images.cjs`);

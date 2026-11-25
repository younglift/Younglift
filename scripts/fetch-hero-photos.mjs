// Discover hero photos made for the screen (Matas, 2026-11-25, FIXES P11).
// tall = 9:16 for the phone, wide = 4:3 for the desktop photo area. Same piece, same light, more background.
// Usage: node scripts/fetch-hero-photos.mjs   (needs sharp and network), then node scripts/optimize-images.cjs
import fs from 'node:fs';
import sharp from 'sharp';
const B = 'https://d8j0ntlcm91z4.cloudfront.net/user_3I4vl7UFNvcvNOyoNZvB1sIC5c7/hf_20261125_';
const TALL = {
  'bracelet': '213338_f61c0ddb-b2b5-4c67-a1e4-b384b5d06872.png',
  'candle': '213528_dc6ab0d2-ef23-483d-a649-bca87c183584.jpeg',
  'cardigan': '213342_ec5deb8c-fbf3-44a9-bd6a-4dfe80f17386.png',
  'crochet-bag': '213449_de1cfcb6-f0f4-41bb-9576-e83b3892ae3a.png',
  'dish': '213649_769fcf0f-f29d-4843-ad28-120f53c3bc15.jpeg',
  'earrings': '213649_f05b7a3e-b8b4-408b-91df-c020360830fa.jpeg',
  'flow-ring': '213648_b299fc76-7d0d-4fd1-bd1c-d9d988b3eb83.jpeg',
  'flower-hood': '213650_c49188b2-12cb-4bad-bd89-05d0017435bb.jpeg',
  'fold-ring': '213650_a5f553ea-bcb5-4cf4-b724-c461ca1ba474.jpeg',
  'morning-cup': '213649_faa52293-7edf-46a8-8e06-46be29d6cefb.jpeg',
  'pink-necklace': '213649_58e65500-9e80-4295-a677-74308de14251.jpeg',
  'plates': '213042_e557e37b-59c1-4aa2-bf45-c07cad6854e7.png',
  'print': '213651_e4d6aa29-1648-4765-9dff-e20b464f60bd.jpeg',
  'rings-set': '213746_9eb97cd7-eb73-40f1-95c1-9a19374ffa04.jpeg',
  'ripple-bowl': '213745_834b25aa-454c-4dcc-a524-a12cde7ee1ae.jpeg',
  'soft-loop': '213749_792ce3d4-3e44-4bea-9fc4-144ef64460ee.jpeg',
  'studio-table': '213745_8ab304c1-9640-4ce1-b785-72ada39cb727.jpeg',
  'twist-vase': '213746_20d12eaa-fe73-45b4-af91-1bc03fc9e289.jpeg',
  'wallet': '213745_55c07c0d-241f-49b3-bbd9-23a643450779.jpeg',
};
const WIDE = {
  'bracelet': '213849_9a71bbb7-3684-4ee5-81be-9c1efaea9447.jpeg',
  'candle': '213845_7d450a45-2d3d-4190-9bf4-809b92aad2c9.jpeg',
  'cardigan': '213845_2f1cf3d6-370f-4a55-9013-8462730ab4e8.jpeg',
  'crochet-bag': '213844_1c6f1840-d99e-494b-bd50-153412d44584.jpeg',
  'dish': '213849_c36c2df2-9071-4428-9256-f8cc6691e694.jpeg',
  'earrings': '213844_d4da23dc-4405-4827-ab18-365685b89fe1.jpeg',
  'flow-ring': '213846_f56ca3e6-2576-4c04-806e-fb82ba6fba35.jpeg',
  'flower-hood': '213843_4a008787-5afb-4121-8206-747966510b7c.jpeg',
  'fold-ring': '213944_93054d81-6c4f-478e-9553-fe8f1ea69879.jpeg',
  'morning-cup': '213945_0aba3a1a-b4e6-4e97-8801-17b0ac5ed8a2.jpeg',
  'pink-necklace': '213945_b5087c87-ecc9-4454-8bd6-6b055ad00ca4.jpeg',
  'print': '213944_5717a47c-1635-47b9-8d8e-6d6e0f204e57.jpeg',
  'rings-set': '213943_b85d23f4-2441-4e26-ad59-3bd30c58b546.jpeg',
  'ripple-bowl': '213945_a2255547-dc46-41e9-871c-cca1f27d9504.jpeg',
  'soft-loop': '213945_b19ad4d7-abf5-459f-a729-00783e84734e.jpeg',
  'studio-table': '213945_2bfa0a76-030b-4d0c-b134-8895998d9ced.jpeg',
  'twist-vase': '214035_359604c3-6e0a-4d43-b0a1-fc0621194416.jpeg',
  'wallet': '214036_2eea67f0-1f4e-4b40-b641-b53cd9c030e9.jpeg',
  'plates': '214036_d209f51b-40ad-458c-b9d8-4ac60087ae00.jpeg',
};
for (const [dir, set, width] of [['tall', TALL, 1080], ['wide', WIDE, 1800]]) {
  fs.mkdirSync(`public/img/${dir}`, { recursive: true });
  for (const [name, file] of Object.entries(set)) {
    const res = await fetch(B + file);
    if (!res.ok) throw new Error(`${dir}/${name}: HTTP ${res.status}`);
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/img/${dir}/${name}.jpg`);
    console.log('ok', dir, name);
  }
}
console.log('done. Now: node scripts/optimize-images.cjs (skip tall/ and wide/ if it makes /t/ copies of them)');

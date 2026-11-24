// Make small copies of photos and stickers (QUALITY 2.6 / FIXES 1.4). Run after adding or replacing images:
//   node scripts/optimize-images.cjs        (needs sharp: npm i -D sharp, if it isn't there yet)
// public/img/x.jpg      -> public/img/t/x.jpg  (320px wide, thumbs and avatars)
//                       -> public/img/w/x.jpg  (128px wide, ALREADY blurred: the screen background.
//                          Blur + saturation are baked in so the browser doesn't run blur(60px) on a
//                          full-screen layer: that made desktop taps lag. Matches --u-wash-filter.)
// public/stickers/x.png -> public/stickers/webp/x.webp (300px wide, ≤ 40 KB)
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const jobs = [];
const out = (d) => fs.mkdirSync(d, { recursive: true });
out('public/img/t'); out('public/img/w'); out('public/stickers/webp');
for (const f of fs.readdirSync('public/img').filter((x) => /\.(jpe?g|png)$/i.test(x))) {
  const src = path.join('public/img', f); const name = f.replace(/\.\w+$/, '.jpg');
  jobs.push(sharp(src).resize({ width: 320 }).jpeg({ quality: 74, mozjpeg: true }).toFile(path.join('public/img/t', name)));
  jobs.push(sharp(src).resize({ width: 128 }).blur(5).modulate({ saturation: 0.9 }).jpeg({ quality: 72 }).toFile(path.join('public/img/w', name)));
}
for (const f of fs.readdirSync('public/stickers').filter((x) => x.endsWith('.png'))) {
  const dst = path.join('public/stickers/webp', f.replace('.png', '.webp'));
  jobs.push((async () => {
    for (const q of [82, 72, 62, 52]) { const buf = await sharp(path.join('public/stickers', f)).resize({ width: 300 }).webp({ quality: q, alphaQuality: 90 }).toBuffer(); if (buf.length <= 40000 || q === 52) { fs.writeFileSync(dst, buf); return; } }
  })());
}
Promise.all(jobs).then(() => console.log(`done: ${jobs.length} files`));

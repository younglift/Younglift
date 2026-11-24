// Small copies made by scripts/optimize-images.cjs (FIXES 1.4).
const local = (u: string) => /^\/img\/[^/]+\.(jpe?g|png)$/i.test(u);
/** 320px copy for thumbs and avatars (≤ 96px on screen). */
export const thumb = (u: string) => (local(u) ? u.replace('/img/', '/img/t/').replace(/\.(png|jpeg)$/i, '.jpg') : u);
/** 64px copy for the blurred screen background. */
export const washSrc = (u: string) => (local(u) ? u.replace('/img/', '/img/w/').replace(/\.(png|jpeg)$/i, '.jpg') : u);

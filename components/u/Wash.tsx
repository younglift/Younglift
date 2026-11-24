/** Screen background: base colour + the screen's photo, heavily blurred (--u-wash-*). */
export default function Wash({ src }: { src?: string }) {
  return <div className="u-wash" aria-hidden="true">{src ? <img src={src} alt="" /> : null}</div>;
}

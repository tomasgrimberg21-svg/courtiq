/** Media cancha de básquet (SVG), líneas sutiles. Decorativo: aria-hidden. */
export function CourtSVG() {
  const stroke = "#24243a";
  return (
    <svg
      viewBox="0 0 300 380"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="288" height="368" rx="6" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Paint / zona */}
      <rect x="110" y="6" width="80" height="150" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Círculo de tiros libres */}
      <circle cx="150" cy="156" r="40" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Aro */}
      <circle cx="150" cy="34" r="9" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Arco de 3 puntos */}
      <path d="M 40 6 L 40 90 A 110 110 0 0 0 260 90 L 260 6" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Línea de medio campo */}
      <line x1="6" y1="374" x2="294" y2="374" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

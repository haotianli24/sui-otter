export function gradientFromAddress(address: string): string {
  // Simple deterministic gradient from address
  const h1 = hash(address) % 360;
  const h2 = (hash(address + 'x') % 360);
  const s = 65;
  const l1 = 55;
  const l2 = 45;
  return `linear-gradient(135deg, hsl(${h1} ${s}% ${l1}%), hsl(${h2} ${s}% ${l2}%))`;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

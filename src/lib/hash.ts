export const hashCode = (s: string) => {
  var hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const hashString = (s: string, radix: number = 10) => {
  var code = hashCode(s);
  return (code >>> 0).toString(radix);
};

export function roundToDP(value: number, dp: number) {
  const multiplier = Math.pow(10, dp);
  return Math.round(value * multiplier) / multiplier;
}

export function formatSA1Code(areaCode: string): string {
  return `${areaCode} (SA1)`;
}
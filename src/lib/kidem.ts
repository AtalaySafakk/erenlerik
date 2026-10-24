import { round2 } from "./payroll";

export function kidemYil(iseBaslama: string, ref = new Date()) {
  if (!iseBaslama) return 0;
  const bas = new Date(iseBaslama);
  if (Number.isNaN(bas.getTime())) return 0;
  return Math.max(0, (ref.getTime() - bas.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function ihbarHafta(yil: number) {
  if (yil < 0.5) return 2;
  if (yil < 1.5) return 4;
  if (yil < 3) return 6;
  return 8;
}

export function kidemIhbar(iseBaslama: string, aylikUcret: number, cikis = new Date()) {
  const yil = kidemYil(iseBaslama, cikis);
  const gunluk = aylikUcret / 30;
  const kidem = round2(yil * 30 * gunluk);
  const hafta = ihbarHafta(yil);
  const ihbar = round2(hafta * 7 * gunluk);
  return { yil: round2(yil), kidem, ihbarHafta: hafta, ihbar };
}

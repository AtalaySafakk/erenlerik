export const VARSAYILAN_GIRIS = "08:00";
export const VARSAYILAN_CIKIS = "16:30";
export const VARSAYILAN_MOLA = 1;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function dakikaParse(saat: string): number | null {
  const m = String(saat || "")
    .trim()
    .match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const d = Number(m[2]);
  if (h > 23 || d > 59) return null;
  return h * 60 + d;
}

export function dakikaYaz(dk: number): string {
  const n = ((dk % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calismaSaati(giris: string, cikis: string, molaSaat = 0): number {
  const a = dakikaParse(giris);
  const b = dakikaParse(cikis);
  if (a == null || b == null) return 0;
  let dk = b - a;
  if (dk <= 0) dk += 24 * 60;
  return round2(Math.max(0, dk / 60 - (molaSaat || 0)));
}

export function cikisHesapla(giris: string, calisma: number, molaSaat = 0): string {
  const a = dakikaParse(giris);
  if (a == null) return "";
  return dakikaYaz(a + Math.round((calisma + (molaSaat || 0)) * 60));
}

export function gunSaati(
  gun: { saat?: number; giris?: string | null; cikis?: string | null },
  molaSaat = 0,
) {
  if (gun.giris && gun.cikis) return calismaSaati(gun.giris, gun.cikis, molaSaat);
  return round2(gun.saat || 0);
}

export function saatEtiket(n: number) {
  return String(round2(n)).replace(".", ",");
}

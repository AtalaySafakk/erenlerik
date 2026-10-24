export const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] as const;

export function para(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

export function paraTl(n: number) {
  return `${para(n)} ₺`;
}

export function adSoyad(p: { adi: string; soyadi: string }) {
  return `${p.adi} ${p.soyadi}`.trim();
}

export function ayGunSayisi(yil: number, ay: number) {
  return new Date(yil, ay, 0).getDate();
}

export function haftaGunu(yil: number, ay: number, gun: number) {
  return new Date(yil, ay - 1, gun).getDay();
}

export function durumEtiket(durum: string) {
  if (durum === "AKTIF" || durum === "DEVAM") return "Aktif";
  if (durum === "PASIF") return "Pasif";
  return durum;
}

export function tarihAraligi(baslangic: string, bitis: string) {
  if (!baslangic || !bitis) return [];
  const [y1, m1, d1] = baslangic.split("-").map(Number);
  const [y2, m2, d2] = bitis.split("-").map(Number);
  if (![y1, m1, d1, y2, m2, d2].every((n) => Number.isFinite(n))) return [];
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return [];
  const gunler: string[] = [];
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const g = String(d.getDate()).padStart(2, "0");
    gunler.push(`${y}-${m}-${g}`);
  }
  return gunler;
}

export function haftaSonuMu(tarih: string) {
  const [y, m, g] = tarih.split("-").map(Number);
  if (![y, m, g].every((n) => Number.isFinite(n))) return false;
  const hd = new Date(y, m - 1, g).getDay();
  return hd === 0 || hd === 6;
}

export function izinTarihleri(
  baslangic: string,
  bitis: string,
  opts?: { sadeceIsGunleri?: boolean; tatiller?: Iterable<string> },
) {
  const gunler = tarihAraligi(baslangic, bitis);
  if (!opts?.sadeceIsGunleri) return gunler;
  const tatil = new Set(opts.tatiller ?? []);
  return gunler.filter((t) => !haftaSonuMu(t) && !tatil.has(t));
}

export function izinGunSayisi(
  baslangic: string,
  bitis: string,
  opts?: { sadeceIsGunleri?: boolean; tatiller?: Iterable<string> },
) {
  return izinTarihleri(baslangic, bitis, opts).length;
}

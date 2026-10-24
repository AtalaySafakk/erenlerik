export type Tatil = { tarih: string; ad: string };

const DINI: Record<number, Tatil[]> = {
  2026: [
    { tarih: "2026-03-20", ad: "Ramazan Bayramı 1. gün" },
    { tarih: "2026-03-21", ad: "Ramazan Bayramı 2. gün" },
    { tarih: "2026-03-22", ad: "Ramazan Bayramı 3. gün" },
    { tarih: "2026-05-27", ad: "Kurban Bayramı 1. gün" },
    { tarih: "2026-05-28", ad: "Kurban Bayramı 2. gün" },
    { tarih: "2026-05-29", ad: "Kurban Bayramı 3. gün" },
    { tarih: "2026-05-30", ad: "Kurban Bayramı 4. gün" },
  ],
};

export function yilinSabitTatilleri(yil: number): Tatil[] {
  return [
    { tarih: `${yil}-01-01`, ad: "Yılbaşı" },
    { tarih: `${yil}-04-23`, ad: "Ulusal Egemenlik ve Çocuk Bayramı" },
    { tarih: `${yil}-05-01`, ad: "Emek ve Dayanışma Günü" },
    { tarih: `${yil}-05-19`, ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { tarih: `${yil}-07-15`, ad: "Demokrasi ve Millî Birlik Günü" },
    { tarih: `${yil}-08-30`, ad: "Zafer Bayramı" },
    { tarih: `${yil}-10-29`, ad: "Cumhuriyet Bayramı" },
    ...(DINI[yil] ?? []),
  ];
}

export function tatilAdi(tarih: string) {
  const yil = Number(tarih.slice(0, 4));
  return yilinSabitTatilleri(yil).find((t) => t.tarih === tarih)?.ad ?? "Resmi tatil";
}

export function tarihYazi(tarih: string) {
  const [y, a, g] = tarih.split("-").map(Number);
  const aylar = [
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
  ];
  return `${g} ${aylar[a - 1]} ${y}`;
}

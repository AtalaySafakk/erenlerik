export const ASGARI_NET = 28075.5;

export function resmiTaban(tutar: number, asgari = ASGARI_NET) {
  return Math.max(asgari, tutar || 0);
}

export type BordroGirdi = {
  netMaas: number;
  resmiUcret: number;
  calismaSaat: number;
  calismaGun: number;
  normalAylikSaat: number;
  mesaiCarpan: number;
  mesaiCarpanTatil?: number;
  tatilMesaiSaat?: number;
  avans: number;
  otomKatilim: number;
  icraKesinti: number;
  ekOdemeManuel?: number;
  besKesinti?: number;
  yemek?: number;
  yol?: number;
  prim?: number;
  yemekHedef?: string;
  yolHedef?: string;
  primHedef?: string;
};

export type BordroSonuc = {
  calismaGun: number;
  calismaSaat: number;
  fazlaMesaiSaat: number;
  tatilMesaiSaat: number;
  mesaiTutari: number;
  ekOdeme: number;
  yemek: number;
  yol: number;
  prim: number;
  netMaas: number;
  resmiUcret: number;
  avans: number;
  otomKatilim: number;
  icraKesinti: number;
  besKesinti: number;
  eksikOran: number;
  bankayaYatacak: number;
  eldenOdenecek: number;
};

function hedefTutar(tutar: number, hedef: string | undefined, taraf: "BANKA" | "ELDEN") {
  return (hedef || "ELDEN") === taraf ? tutar || 0 : 0;
}

export function hesaplaBordro(girdi: BordroGirdi): BordroSonuc {
  const tam = girdi.normalAylikSaat > 0 ? girdi.normalAylikSaat : 180;
  const resmiAy = resmiTaban(girdi.resmiUcret);
  const tatilMesaiSaat = round2(girdi.tatilMesaiSaat ?? 0);
  const normalSaat = round2(Math.max(0, girdi.calismaSaat - tatilMesaiSaat));
  const oran = tam > 0 ? Math.min(1, normalSaat / tam) : 0;
  const tamAy = normalSaat >= tam;
  const resmiDonem = round2(resmiAy * (tamAy ? 1 : oran));
  const netDonem = round2(girdi.netMaas * (tamAy ? 1 : oran));
  const fazlaMesaiSaat = Math.max(0, round2(normalSaat - tam));
  const saatlikResmi = tam > 0 ? resmiAy / tam : 0;
  const carpanTatil = girdi.mesaiCarpanTatil ?? 2;
  const mesaiTutari = round2(
    fazlaMesaiSaat * saatlikResmi * girdi.mesaiCarpan +
      tatilMesaiSaat * saatlikResmi * carpanTatil,
  );
  const ekManuel = girdi.ekOdemeManuel ?? 0;
  const yemek = round2(girdi.yemek ?? 0);
  const yol = round2(girdi.yol ?? 0);
  const prim = round2(girdi.prim ?? 0);
  const ekOdeme = round2(mesaiTutari + ekManuel);
  const besKesinti = girdi.besKesinti ?? 0;
  const bankaEk =
    hedefTutar(yemek, girdi.yemekHedef, "BANKA") +
    hedefTutar(yol, girdi.yolHedef, "BANKA") +
    hedefTutar(prim, girdi.primHedef, "BANKA");
  const eldenEk =
    hedefTutar(yemek, girdi.yemekHedef, "ELDEN") +
    hedefTutar(yol, girdi.yolHedef, "ELDEN") +
    hedefTutar(prim, girdi.primHedef, "ELDEN");
  const bankayaYatacak = round2(resmiDonem - girdi.icraKesinti - besKesinti + bankaEk);
  const eldenOdenecek = round2(
    netDonem - resmiDonem + ekOdeme + eldenEk - girdi.avans - girdi.otomKatilim,
  );

  return {
    calismaGun: round2(girdi.calismaGun),
    calismaSaat: round2(girdi.calismaSaat),
    fazlaMesaiSaat,
    tatilMesaiSaat,
    mesaiTutari,
    ekOdeme,
    yemek,
    yol,
    prim,
    netMaas: netDonem,
    resmiUcret: resmiDonem,
    avans: girdi.avans,
    otomKatilim: girdi.otomKatilim,
    icraKesinti: girdi.icraKesinti,
    besKesinti,
    eksikOran: round2(oran),
    bankayaYatacak,
    eldenOdenecek,
  };
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function icraKesintiTutari(
  kayit: { kesintiTip?: string | null; kesinti: number; kesintiYuzde?: number | null },
  netMaas: number,
) {
  if ((kayit.kesintiTip ?? "TUTAR") === "YUZDE") {
    const yuzde = Math.min(100, Math.max(0, kayit.kesintiYuzde ?? 0));
    return round2((netMaas || 0) * (yuzde / 100));
  }
  return round2(kayit.kesinti || 0);
}

export function kdemIzinHakki(iseBaslama: string, ref = new Date()) {
  if (!iseBaslama) return 14;
  const bas = new Date(iseBaslama);
  if (Number.isNaN(bas.getTime())) return 14;
  const yil = (ref.getTime() - bas.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (yil >= 15) return 26;
  if (yil >= 5) return 20;
  return 14;
}

export const PUANTAJ_KODLARI = {
  C: { kisa: "Ç", ad: "Çalıştı", renk: "calisti" },
  I: { kisa: "İ", ad: "Yıllık izin", renk: "izin" },
  R: { kisa: "R", ad: "Rapor", renk: "rapor" },
  M: { kisa: "M", ad: "Mazeret", renk: "mazeret" },
  H: { kisa: "H", ad: "Hafta tatili", renk: "hafta" },
  T: { kisa: "T", ad: "Resmi tatil", renk: "tatil" },
  B: { kisa: "", ad: "Boş", renk: "bos" },
} as const;

export type PuantajKod = keyof typeof PUANTAJ_KODLARI;

export function izinKodu(tip: string): PuantajKod {
  if (tip === "RAPOR") return "R";
  if (tip === "MAZERET") return "M";
  return "I";
}

export function parseTatiller(raw?: string | null) {
  return (raw ?? "")
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function tarihYaz(yil: number, ay: number, gun: number) {
  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

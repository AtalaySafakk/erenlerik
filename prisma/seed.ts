import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import {
  hesaplaBordro,
  icraKesintiTutari,
  parseTatiller,
  resmiTaban,
  tarihYaz,
} from "../src/lib/payroll";

const prisma = new PrismaClient();

const SSK = "24711010110384880600107000";
const RESMI = 28075.5;
const NORMAL_SAAT = 180;
const TATILLER =
  "2026-01-01,2026-03-20,2026-03-21,2026-03-22,2026-04-23,2026-05-01,2026-05-19,2026-05-27,2026-05-28,2026-05-29,2026-07-15,2026-08-30,2026-10-29";

function iban(n: number) {
  return `TR12 0006 2000 0000 0000 0000 ${String(n).padStart(2, "0")}`;
}

function tc(n: number) {
  return String(10000000000 + n * 111).padStart(11, "0").slice(0, 11);
}

function sifreHash(sifre: string) {
  const tuz = randomBytes(16).toString("hex");
  return `${tuz}:${scryptSync(sifre, tuz, 32).toString("hex")}`;
}

const VARDIYA: Record<string, { giris: string; cikis: string; mola: number }> = {
  OFİS: { giris: "08:00", cikis: "16:30", mola: 1 },
  MUHASEBE: { giris: "08:00", cikis: "16:30", mola: 1 },
  SAHA: { giris: "07:30", cikis: "18:00", mola: 1 },
  ŞANTİYE: { giris: "07:30", cikis: "18:00", mola: 1 },
  ÜRETİM: { giris: "08:00", cikis: "17:00", mola: 1 },
  DEPO: { giris: "08:00", cikis: "17:00", mola: 1 },
};

type Profil = "ahmet" | "ofis" | "saha" | "mesai";

function gunlerUret(
  yil: number,
  ay: number,
  profil: Profil,
  ozel: Record<number, { kod: string; saat: number }> = {},
) {
  const son = new Date(yil, ay, 0).getDate();
  const gunler: { gun: number; kod: string; saat: number; giris?: string; cikis?: string }[] = [];
  for (let gun = 1; gun <= son; gun++) {
    if (ozel[gun]) {
      gunler.push({ gun, ...ozel[gun] });
      continue;
    }
    const hd = new Date(yil, ay - 1, gun).getDay();
    if (profil === "ahmet") {
      gunler.push(hd === 0 || gun === 31 ? { gun, kod: "H", saat: 0 } : { gun, kod: "C", saat: 7.5 });
      continue;
    }
    if (ay === 10 && gun === 29) {
      gunler.push({ gun, kod: "T", saat: 0 });
      continue;
    }
    if (hd === 0) {
      gunler.push({ gun, kod: "H", saat: 0 });
      continue;
    }
    if (hd === 6) {
      if (profil === "saha" && (gun === 3 || gun === 17 || gun === 24)) {
        gunler.push({ gun, kod: "C", saat: 7.5 });
      } else if (profil === "mesai" && gun !== 31) {
        gunler.push({ gun, kod: "C", saat: 8 });
      } else {
        gunler.push({ gun, kod: "H", saat: 0 });
      }
      continue;
    }
    gunler.push({ gun, kod: "C", saat: profil === "mesai" ? 8.5 : 7.5 });
  }
  return gunler.map((g) => {
    if (g.kod !== "C" || !g.saat) return { ...g, giris: "", cikis: "" };
    const girisDk = 8 * 60;
    const cikisDk = girisDk + Math.round((g.saat + 1) * 60);
    const hh = Math.floor(cikisDk / 60);
    const mm = cikisDk % 60;
    return {
      ...g,
      giris: "08:00",
      cikis: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    };
  });
}

type Kisi = {
  adi: string;
  soyadi: string;
  yer: string;
  cinsiyet: "BAY" | "BAYAN";
  gorevi: string;
  netMaas: number;
  iseBaslamaTarihi: string;
  dogumTarihi: string;
  yillikIzinHakki: number;
  besDurum: "VAR" | "YOK";
  otomKatilimBedeli: number;
  medeniDurum: string;
  cocukSayisi: number;
  gsm: string;
  adres: string;
  durum: "AKTIF" | "PASIF";
  istenAyrilisTarihi?: string;
  profil: Profil;
  ozel?: Record<number, { kod: string; saat: number }>;
};

const KADRO: Kisi[] = [
  {
    adi: "Ahmet",
    soyadi: "Yılmaz",
    yer: "MUHASEBE",
    cinsiyet: "BAY",
    gorevi: "MUHASEBE ŞEFİ",
    netMaas: 40000,
    iseBaslamaTarihi: "2018-03-12",
    dogumTarihi: "1988-04-21",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0532 111 22 33",
    adres: "Atatürk Mah. Örnek Sk. No:12 Kadıköy / İstanbul",
    durum: "AKTIF",
    profil: "ahmet",
  },
  {
    adi: "Elif",
    soyadi: "Kaya",
    yer: "MUHASEBE",
    cinsiyet: "BAYAN",
    gorevi: "ÖN MUHASEBE",
    netMaas: 36000,
    iseBaslamaTarihi: "2021-09-01",
    dogumTarihi: "1994-11-08",
    yillikIzinHakki: 14,
    besDurum: "VAR",
    otomKatilimBedeli: 750,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0533 444 55 66",
    adres: "Merkez Mah. Çınar Cad. No:5 Ümraniye / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
    ozel: { 2: { kod: "M", saat: 0 } },
  },
  {
    adi: "Burak",
    soyadi: "Şahin",
    yer: "MUHASEBE",
    cinsiyet: "BAY",
    gorevi: "BORDRO UZMANI",
    netMaas: 38500,
    iseBaslamaTarihi: "2019-01-14",
    dogumTarihi: "1991-06-03",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 500,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0532 200 11 22",
    adres: "İstiklal Mah. 14. Cad. No:8 Kartal / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Zeynep",
    soyadi: "Arslan",
    yer: "MUHASEBE",
    cinsiyet: "BAYAN",
    gorevi: "CARİ HESAP",
    netMaas: 34500,
    iseBaslamaTarihi: "2022-04-11",
    dogumTarihi: "1996-09-19",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0541 330 44 55",
    adres: "Fenerbahçe Mah. Ihlamur Sk. No:3 Kadıköy / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
    ozel: { 13: { kod: "I", saat: 0 }, 14: { kod: "I", saat: 0 }, 15: { kod: "I", saat: 0 } },
  },
  {
    adi: "Fatma",
    soyadi: "Aydın",
    yer: "MUHASEBE",
    cinsiyet: "BAYAN",
    gorevi: "VEZNEDAR",
    netMaas: 33000,
    iseBaslamaTarihi: "2020-11-02",
    dogumTarihi: "1993-02-27",
    yillikIzinHakki: 14,
    besDurum: "VAR",
    otomKatilimBedeli: 400,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0505 118 77 88",
    adres: "Yenimahalle Cad. No:41 Maltepe / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Ayşe",
    soyadi: "Çelik",
    yer: "OFİS",
    cinsiyet: "BAYAN",
    gorevi: "İDARİ İŞLER",
    netMaas: 34000,
    iseBaslamaTarihi: "2023-02-06",
    dogumTarihi: "1998-07-14",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0505 222 33 44",
    adres: "Göztepe Mah. Bağdat Cad. No:210 Kadıköy / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Merve",
    soyadi: "Aksoy",
    yer: "OFİS",
    cinsiyet: "BAYAN",
    gorevi: "SEKRETERYA",
    netMaas: 32000,
    iseBaslamaTarihi: "2024-03-18",
    dogumTarihi: "2001-05-09",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0530 612 90 11",
    adres: "Erenköy Mah. Nişantaşı Sk. No:7 Kadıköy / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Caner",
    soyadi: "Yıldız",
    yer: "OFİS",
    cinsiyet: "BAY",
    gorevi: "SATIN ALMA",
    netMaas: 37500,
    iseBaslamaTarihi: "2019-08-20",
    dogumTarihi: "1989-12-01",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 1200,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0532 745 10 20",
    adres: "Kozyatağı Mah. Aytekin Sk. No:16 Ataşehir / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Selin",
    soyadi: "Doğan",
    yer: "OFİS",
    cinsiyet: "BAYAN",
    gorevi: "İNSAN KAYNAKLARI",
    netMaas: 39000,
    iseBaslamaTarihi: "2020-05-04",
    dogumTarihi: "1992-03-16",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0542 881 33 00",
    adres: "Bostancı Mah. Bağdat Cad. No:455 Kadıköy / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Emre",
    soyadi: "Acar",
    yer: "OFİS",
    cinsiyet: "BAY",
    gorevi: "BİLGİ İŞLEM",
    netMaas: 42000,
    iseBaslamaTarihi: "2021-01-11",
    dogumTarihi: "1995-08-22",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0536 219 45 67",
    adres: "Ataşehir Barbaros Mah. Begonya Sk. No:9 Ataşehir / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Mehmet",
    soyadi: "Demir",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA PERSONELİ",
    netMaas: 38000,
    iseBaslamaTarihi: "2019-06-15",
    dogumTarihi: "1990-01-30",
    yillikIzinHakki: 20,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0541 777 88 99",
    adres: "Yeni Mah. Sanayi Cad. No:44 Pendik / İstanbul",
    durum: "AKTIF",
    profil: "saha",
    ozel: { 8: { kod: "R", saat: 0 }, 9: { kod: "R", saat: 0 } },
  },
  {
    adi: "Hasan",
    soyadi: "Koç",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA PERSONELİ",
    netMaas: 32000,
    iseBaslamaTarihi: "2024-01-08",
    dogumTarihi: "2000-12-02",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0536 999 00 11",
    adres: "Cumhuriyet Mah. 12. Sok. No:3 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Ali",
    soyadi: "Öztürk",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA FORMEN",
    netMaas: 36500,
    iseBaslamaTarihi: "2017-09-25",
    dogumTarihi: "1985-07-07",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 800,
    medeniDurum: "EVLİ",
    cocukSayisi: 3,
    gsm: "0532 414 20 30",
    adres: "Kaynarca Mah. Ankara Cad. No:118 Pendik / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Serkan",
    soyadi: "Kılıç",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA PERSONELİ",
    netMaas: 35000,
    iseBaslamaTarihi: "2022-06-01",
    dogumTarihi: "1997-10-13",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0543 120 88 77",
    adres: "Esenyalı Mah. 19 Mayıs Cad. No:22 Pendik / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Volkan",
    soyadi: "Eren",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "ŞOFÖR",
    netMaas: 34000,
    iseBaslamaTarihi: "2018-11-19",
    dogumTarihi: "1987-04-04",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0535 909 12 34",
    adres: "Aydınlı Mah. Deniz Sk. No:6 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Onur",
    soyadi: "Polat",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA PERSONELİ",
    netMaas: 33000,
    iseBaslamaTarihi: "2023-07-03",
    dogumTarihi: "1999-01-21",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0537 661 45 45",
    adres: "Yayalar Mah. 23 Nisan Cad. No:17 Pendik / İstanbul",
    durum: "AKTIF",
    profil: "saha",
    ozel: { 16: { kod: "M", saat: 0 } },
  },
  {
    adi: "Barış",
    soyadi: "Tekin",
    yer: "SAHA",
    cinsiyet: "BAY",
    gorevi: "SAHA PERSONELİ",
    netMaas: 35500,
    iseBaslamaTarihi: "2020-02-17",
    dogumTarihi: "1992-11-11",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0546 303 21 21",
    adres: "Güzelyalı Mah. Sahil Yolu No:90 Pendik / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Hakan",
    soyadi: "Güneş",
    yer: "DEPO",
    cinsiyet: "BAY",
    gorevi: "DEPO SORUMLUSU",
    netMaas: 36000,
    iseBaslamaTarihi: "2016-05-09",
    dogumTarihi: "1984-09-02",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0532 880 70 60",
    adres: "Orhanlı Mah. Fabrika Cad. No:12 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Murat",
    soyadi: "Çetin",
    yer: "DEPO",
    cinsiyet: "BAY",
    gorevi: "DEPOCU",
    netMaas: 31500,
    iseBaslamaTarihi: "2022-10-10",
    dogumTarihi: "1996-06-18",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0534 212 33 44",
    adres: "Tepeören Mah. OSB 3. Cad. No:5 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "İbrahim",
    soyadi: "Kara",
    yer: "DEPO",
    cinsiyet: "BAY",
    gorevi: "FORKLİFT OPERATÖRÜ",
    netMaas: 33500,
    iseBaslamaTarihi: "2019-03-04",
    dogumTarihi: "1991-12-29",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0541 555 66 77",
    adres: "Şifa Mah. 50. Yıl Cad. No:31 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Derya",
    soyadi: "Uçar",
    yer: "DEPO",
    cinsiyet: "BAYAN",
    gorevi: "SEVKİYAT",
    netMaas: 32500,
    iseBaslamaTarihi: "2023-05-22",
    dogumTarihi: "1998-08-08",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0530 404 18 18",
    adres: "Aydıntepe Mah. İstasyon Cad. No:4 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
    ozel: { 20: { kod: "I", saat: 0 }, 21: { kod: "I", saat: 0 } },
  },
  {
    adi: "Gökhan",
    soyadi: "Avcı",
    yer: "DEPO",
    cinsiyet: "BAY",
    gorevi: "DEPOCU",
    netMaas: 31000,
    iseBaslamaTarihi: "2024-08-12",
    dogumTarihi: "2002-02-14",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0539 171 90 90",
    adres: "İçmeler Mah. Plaj Yolu No:11 Tuzla / İstanbul",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Kemal",
    soyadi: "Taş",
    yer: "ÜRETİM",
    cinsiyet: "BAY",
    gorevi: "USTABAŞI",
    netMaas: 41000,
    iseBaslamaTarihi: "2015-04-06",
    dogumTarihi: "1982-01-19",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 3,
    gsm: "0532 600 10 10",
    adres: "Dilovası Mah. Sanayi 2. Cad. No:8 Kocaeli",
    durum: "AKTIF",
    profil: "mesai",
  },
  {
    adi: "Yusuf",
    soyadi: "Işık",
    yer: "ÜRETİM",
    cinsiyet: "BAY",
    gorevi: "TORNA OPERATÖRÜ",
    netMaas: 35500,
    iseBaslamaTarihi: "2020-09-14",
    dogumTarihi: "1993-05-25",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0542 333 22 11",
    adres: "Tavşanlı Mah. 4. Sok. No:19 Gebze / Kocaeli",
    durum: "AKTIF",
    profil: "mesai",
  },
  {
    adi: "Sibel",
    soyadi: "Koçak",
    yer: "ÜRETİM",
    cinsiyet: "BAYAN",
    gorevi: "KALİTE KONTROL",
    netMaas: 34500,
    iseBaslamaTarihi: "2021-12-06",
    dogumTarihi: "1995-10-30",
    yillikIzinHakki: 14,
    besDurum: "VAR",
    otomKatilimBedeli: 350,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0507 818 40 40",
    adres: "Çayırova Mah. Atatürk Cad. No:56 Kocaeli",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Tuncay",
    soyadi: "Erdem",
    yer: "ÜRETİM",
    cinsiyet: "BAY",
    gorevi: "KAYNAKÇI",
    netMaas: 37000,
    iseBaslamaTarihi: "2018-07-23",
    dogumTarihi: "1986-03-03",
    yillikIzinHakki: 20,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0535 444 55 00",
    adres: "Darica Mah. İstasyon Cad. No:72 Kocaeli",
    durum: "AKTIF",
    profil: "mesai",
    ozel: { 6: { kod: "R", saat: 0 }, 7: { kod: "R", saat: 0 }, 8: { kod: "R", saat: 0 } },
  },
  {
    adi: "Pınar",
    soyadi: "Yavuz",
    yer: "ÜRETİM",
    cinsiyet: "BAYAN",
    gorevi: "MONTAJ",
    netMaas: 32500,
    iseBaslamaTarihi: "2022-01-17",
    dogumTarihi: "1997-09-09",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0530 909 77 66",
    adres: "Eskihisar Mah. Kale Sk. No:2 Gebze / Kocaeli",
    durum: "AKTIF",
    profil: "ofis",
  },
  {
    adi: "Okan",
    soyadi: "Demirel",
    yer: "ÜRETİM",
    cinsiyet: "BAY",
    gorevi: "CNC OPERATÖRÜ",
    netMaas: 38000,
    iseBaslamaTarihi: "2019-10-28",
    dogumTarihi: "1990-08-15",
    yillikIzinHakki: 20,
    besDurum: "VAR",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0544 121 32 32",
    adres: "Beylikbağı Mah. 2. Cad. No:40 Gebze / Kocaeli",
    durum: "AKTIF",
    profil: "mesai",
  },
  {
    adi: "Recep",
    soyadi: "Kurt",
    yer: "ŞANTİYE",
    cinsiyet: "BAY",
    gorevi: "ŞANTİYE ŞEFİ",
    netMaas: 48000,
    iseBaslamaTarihi: "2014-02-03",
    dogumTarihi: "1980-11-05",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 1500,
    medeniDurum: "EVLİ",
    cocukSayisi: 3,
    gsm: "0532 100 20 30",
    adres: "Sultanbeyli Mah. Fatih Cad. No:88 İstanbul",
    durum: "AKTIF",
    profil: "mesai",
  },
  {
    adi: "Cemil",
    soyadi: "Aslan",
    yer: "ŞANTİYE",
    cinsiyet: "BAY",
    gorevi: "İNŞAAT USTASI",
    netMaas: 39000,
    iseBaslamaTarihi: "2017-06-12",
    dogumTarihi: "1983-04-28",
    yillikIzinHakki: 26,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 2,
    gsm: "0533 700 80 90",
    adres: "Sancaktepe Yenidoğan Mah. No:15 İstanbul",
    durum: "AKTIF",
    profil: "mesai",
  },
  {
    adi: "Fatih",
    soyadi: "Bozkurt",
    yer: "ŞANTİYE",
    cinsiyet: "BAY",
    gorevi: "KALIPÇI",
    netMaas: 36000,
    iseBaslamaTarihi: "2021-03-29",
    dogumTarihi: "1994-07-17",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0541 260 40 50",
    adres: "Çekmeköy Mehmet Akif Mah. No:27 İstanbul",
    durum: "AKTIF",
    profil: "saha",
  },
  {
    adi: "Halil",
    soyadi: "Şimşek",
    yer: "ŞANTİYE",
    cinsiyet: "BAY",
    gorevi: "DEMİRCİ",
    netMaas: 35000,
    iseBaslamaTarihi: "2020-08-10",
    dogumTarihi: "1992-02-02",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0536 808 09 09",
    adres: "Ümraniye Dudullu OSB 2. Cad. No:18 İstanbul",
    durum: "AKTIF",
    profil: "saha",
    ozel: { 22: { kod: "M", saat: 0 }, 23: { kod: "M", saat: 0 } },
  },
  {
    adi: "Deniz",
    soyadi: "Özer",
    yer: "OFİS",
    cinsiyet: "BAYAN",
    gorevi: "ÖN MUHASEBE",
    netMaas: 31000,
    iseBaslamaTarihi: "2022-09-05",
    dogumTarihi: "1999-04-12",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "BEKAR",
    cocukSayisi: 0,
    gsm: "0530 111 22 00",
    adres: "Kadıköy Rasimpaşa Mah. No:4 İstanbul",
    durum: "PASIF",
    istenAyrilisTarihi: "2026-06-30",
    profil: "ofis",
  },
  {
    adi: "Gülşah",
    soyadi: "İnce",
    yer: "MUHASEBE",
    cinsiyet: "BAYAN",
    gorevi: "CARİ HESAP",
    netMaas: 30000,
    iseBaslamaTarihi: "2021-02-01",
    dogumTarihi: "1996-12-20",
    yillikIzinHakki: 14,
    besDurum: "YOK",
    otomKatilimBedeli: 0,
    medeniDurum: "EVLİ",
    cocukSayisi: 1,
    gsm: "0542 000 11 22",
    adres: "Maltepe Cevizli Mah. No:21 İstanbul",
    durum: "PASIF",
    istenAyrilisTarihi: "2025-12-31",
    profil: "ofis",
  },
];

async function main() {
  await prisma.puantajGun.deleteMany();
  await prisma.puantaj.deleteMany();
  await prisma.bordro.deleteMany();
  await prisma.avans.deleteMany();
  await prisma.izin.deleteMany();
  await prisma.icraDonem.deleteMany();
  await prisma.icra.deleteMany();
  await prisma.belge.deleteMany();
  await prisma.personel.deleteMany();
  await prisma.gorevYeri.deleteMany();
  await prisma.kullanici.deleteMany();
  await prisma.ayar.deleteMany();
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence");

  await prisma.ayar.create({
    data: {
      id: 1,
      firmaAdi: "Marmara Teknik",
      resmiUcret: RESMI,
      normalAylikSaat: NORMAL_SAAT,
      tamAyGun: 26,
      mesaiCarpan: 1.5,
      mesaiCarpanTatil: 2,
      varsayilanGunSaat: 7.5,
      varsayilanGiris: "08:00",
      varsayilanCikis: "16:30",
      molaSaat: 1,
      resmiTatiller: TATILLER,
    },
  });

  const yerAdlari = [...new Set(KADRO.map((k) => k.yer))];
  const yerMap = new Map<string, number>();
  for (const ad of yerAdlari) {
    const v = VARDIYA[ad] ?? { giris: "08:00", cikis: "16:30", mola: 1 };
    const yer = await prisma.gorevYeri.create({
      data: {
        ad,
        varsayilanGiris: v.giris,
        varsayilanCikis: v.cikis,
        molaSaat: v.mola,
      },
    });
    yerMap.set(ad, yer.id);
  }

  const kayitlar: { id: number; kisi: Kisi }[] = [];
  for (let i = 0; i < KADRO.length; i++) {
    const k = KADRO[i];
    const p = await prisma.personel.create({
      data: {
        adi: k.adi,
        soyadi: k.soyadi,
        gorevYeriId: yerMap.get(k.yer)!,
        cinsiyet: k.cinsiyet,
        gorevi: k.gorevi,
        tcKimlik: tc(i + 1),
        icraDurum: "ICRAYOK",
        hesapNo: iban(i + 1),
        iseBaslamaTarihi: k.iseBaslamaTarihi,
        dogumTarihi: k.dogumTarihi,
        netMaas: k.netMaas,
        resmiMaas: RESMI,
        ekOdeme: k.yer === "ŞANTİYE" ? 1500 : k.yer === "ÜRETİM" ? 750 : 0,
        yemek: k.yer === "ŞANTİYE" ? 150 : 0,
        yol: k.yer === "SAHA" || k.yer === "ŞANTİYE" ? 200 : 0,
        denemeBitis: i < 2 ? "2026-11-05" : "",
        sozlesmeBitis: i === 3 ? "2026-11-12" : "",
        besDurum: k.besDurum,
        besKesinti: k.besDurum === "VAR" ? 650 : 0,
        otomKatilimBedeli: k.otomKatilimBedeli,
        durum: k.durum,
        istenAyrilisTarihi: k.istenAyrilisTarihi ?? "",
        yillikIzinHakki: k.yillikIzinHakki,
        adres: k.adres,
        sskIsyeriNo: SSK,
        gsm: k.gsm,
        medeniDurum: k.medeniDurum,
        cocukSayisi: k.cocukSayisi,
      },
    });
    kayitlar.push({ id: p.id, kisi: k });
  }

  const idOf = (adi: string, soyadi: string) =>
    kayitlar.find((x) => x.kisi.adi === adi && x.kisi.soyadi === soyadi)!.id;

  await prisma.izin.createMany({
    data: [
      { personelId: idOf("Elif", "Kaya"), tip: "YILLIK", baslangic: "2026-07-13", bitis: "2026-07-17", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Elif", "Kaya"), tip: "MAZERET", baslangic: "2026-10-02", bitis: "2026-10-02", gun: 1, aciklama: "Ailevi mazeret", durum: "ONAYLANDI" },
      { personelId: idOf("Ahmet", "Yılmaz"), tip: "YILLIK", baslangic: "2026-08-03", bitis: "2026-08-14", gun: 10, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Burak", "Şahin"), tip: "YILLIK", baslangic: "2026-06-15", bitis: "2026-06-19", gun: 5, aciklama: "Haziran izni", durum: "ONAYLANDI" },
      { personelId: idOf("Zeynep", "Arslan"), tip: "YILLIK", baslangic: "2026-10-13", bitis: "2026-10-15", gun: 3, aciklama: "Ekim izin", durum: "ONAYLANDI" },
      { personelId: idOf("Fatma", "Aydın"), tip: "YILLIK", baslangic: "2026-07-20", bitis: "2026-07-24", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Ayşe", "Çelik"), tip: "YILLIK", baslangic: "2026-08-10", bitis: "2026-08-14", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Caner", "Yıldız"), tip: "YILLIK", baslangic: "2026-09-01", bitis: "2026-09-11", gun: 9, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Selin", "Doğan"), tip: "YILLIK", baslangic: "2026-07-06", bitis: "2026-07-17", gun: 10, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Emre", "Acar"), tip: "YILLIK", baslangic: "2026-05-11", bitis: "2026-05-15", gun: 5, aciklama: "Mayıs izni", durum: "ONAYLANDI" },
      { personelId: idOf("Mehmet", "Demir"), tip: "YILLIK", baslangic: "2026-08-17", bitis: "2026-08-21", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Mehmet", "Demir"), tip: "RAPOR", baslangic: "2026-10-08", bitis: "2026-10-09", gun: 2, aciklama: "İstirahat raporu", durum: "ONAYLANDI" },
      { personelId: idOf("Ali", "Öztürk"), tip: "YILLIK", baslangic: "2026-07-01", bitis: "2026-07-10", gun: 8, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Serkan", "Kılıç"), tip: "MAZERET", baslangic: "2026-09-14", bitis: "2026-09-14", gun: 1, aciklama: "Vefat", durum: "ONAYLANDI" },
      { personelId: idOf("Volkan", "Eren"), tip: "YILLIK", baslangic: "2026-06-22", bitis: "2026-06-26", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Onur", "Polat"), tip: "MAZERET", baslangic: "2026-10-16", bitis: "2026-10-16", gun: 1, aciklama: "Mahkeme", durum: "ONAYLANDI" },
      { personelId: idOf("Hakan", "Güneş"), tip: "YILLIK", baslangic: "2026-08-03", bitis: "2026-08-14", gun: 10, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Derya", "Uçar"), tip: "YILLIK", baslangic: "2026-10-20", bitis: "2026-10-21", gun: 2, aciklama: "Ekim izin", durum: "ONAYLANDI" },
      { personelId: idOf("Kemal", "Taş"), tip: "YILLIK", baslangic: "2026-07-13", bitis: "2026-07-24", gun: 10, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Tuncay", "Erdem"), tip: "RAPOR", baslangic: "2026-10-06", bitis: "2026-10-08", gun: 3, aciklama: "İş kazası istirahat", durum: "ONAYLANDI" },
      { personelId: idOf("Recep", "Kurt"), tip: "YILLIK", baslangic: "2026-09-07", bitis: "2026-09-11", gun: 5, aciklama: "Yıllık izin", durum: "ONAYLANDI" },
      { personelId: idOf("Cemil", "Aslan"), tip: "YILLIK", baslangic: "2026-08-24", bitis: "2026-08-28", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Halil", "Şimşek"), tip: "MAZERET", baslangic: "2026-10-22", bitis: "2026-10-23", gun: 2, aciklama: "Ailevi mazeret", durum: "ONAYLANDI" },
      { personelId: idOf("Sibel", "Koçak"), tip: "YILLIK", baslangic: "2026-06-08", bitis: "2026-06-12", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
      { personelId: idOf("Okan", "Demirel"), tip: "YILLIK", baslangic: "2026-07-27", bitis: "2026-07-31", gun: 5, aciklama: "Yaz izni", durum: "ONAYLANDI" },
    ],
  });

  await prisma.icra.createMany({
    data: [
      { personelId: idOf("Mehmet", "Demir"), dosyaNo: "2025/1842", alacakli: "Pendik 3. İcra Dairesi", tutar: 48000, kesinti: 2500, odenen: 17500, baslangic: "2026-03-01", bitis: "", aktif: true },
      { personelId: idOf("Ali", "Öztürk"), dosyaNo: "2024/903", alacakli: "Kartal 2. İcra Dairesi", tutar: 26500, kesinti: 1800, odenen: 10800, baslangic: "2025-11-12", bitis: "", aktif: true },
      { personelId: idOf("Hakan", "Güneş"), dosyaNo: "2026/441", alacakli: "Tuzla İcra Dairesi", tutar: 15200, kesinti: 0, kesintiTip: "YUZDE", kesintiYuzde: 5, odenen: 4800, baslangic: "2026-06-01", bitis: "", aktif: true },
      { personelId: idOf("Recep", "Kurt"), dosyaNo: "2025/77", alacakli: "Sultanbeyli İcra Dairesi", tutar: 82000, kesinti: 4000, odenen: 28000, baslangic: "2025-09-15", bitis: "", aktif: true },
      { personelId: idOf("Volkan", "Eren"), dosyaNo: "2023/2104", alacakli: "Pendik 1. İcra Dairesi", tutar: 9800, kesinti: 800, odenen: 9800, baslangic: "2024-02-01", bitis: "2026-08-31", aktif: false },
    ],
  });

  await prisma.personel.updateMany({
    where: { id: { in: [idOf("Mehmet", "Demir"), idOf("Ali", "Öztürk"), idOf("Hakan", "Güneş"), idOf("Recep", "Kurt")] } },
    data: { icraDurum: "ICRAVAR" },
  });

  const yil = 2026;
  const ay = 10;
  const avanslar: { adi: string; soyadi: string; tutar: number; aciklama: string; tarih: string }[] = [
    { adi: "Elif", soyadi: "Kaya", tutar: 3000, aciklama: "Ekim avansı", tarih: "2026-10-05" },
    { adi: "Hasan", soyadi: "Koç", tutar: 2000, aciklama: "Avans", tarih: "2026-10-07" },
    { adi: "Serkan", soyadi: "Kılıç", tutar: 2500, aciklama: "Avans", tarih: "2026-10-08" },
    { adi: "Murat", soyadi: "Çetin", tutar: 1500, aciklama: "Avans", tarih: "2026-10-09" },
    { adi: "Yusuf", soyadi: "Işık", tutar: 4000, aciklama: "Avans", tarih: "2026-10-06" },
    { adi: "Fatih", soyadi: "Bozkurt", tutar: 3000, aciklama: "Avans", tarih: "2026-10-10" },
    { adi: "Merve", soyadi: "Aksoy", tutar: 1000, aciklama: "Avans", tarih: "2026-10-03" },
    { adi: "Cemil", soyadi: "Aslan", tutar: 5000, aciklama: "Avans", tarih: "2026-10-04" },
  ];
  await prisma.avans.createMany({
    data: avanslar.map((a) => ({
      personelId: idOf(a.adi, a.soyadi),
      yil,
      ay,
      tutar: a.tutar,
      aciklama: a.aciklama,
      tarih: a.tarih,
    })),
  });

  const tatiller = new Set(parseTatiller(TATILLER));
  const icraKesinti = new Map<number, number>();
  const icraAy: { id: number; tutar: number; odenen: number }[] = [];
  for (const i of await prisma.icra.findMany({
    where: { aktif: true },
    include: { personel: true },
  })) {
    const tutar = icraKesintiTutari(i, i.personel.netMaas);
    icraKesinti.set(i.personelId, (icraKesinti.get(i.personelId) ?? 0) + tutar);
    icraAy.push({ id: i.id, tutar, odenen: i.odenen });
  }
  const avansMap = new Map<number, number>();
  for (const a of await prisma.avans.findMany({ where: { yil, ay } })) {
    avansMap.set(a.personelId, (avansMap.get(a.personelId) ?? 0) + a.tutar);
  }

  for (const { id, kisi } of kayitlar) {
    if (kisi.durum !== "AKTIF") continue;
    const gunler = gunlerUret(yil, ay, kisi.profil, kisi.ozel);
    const puantaj = await prisma.puantaj.create({
      data: {
        personelId: id,
        yil,
        ay,
        notlar: kisi.profil === "ahmet" ? "Örnek: 26 gün / 195 saat · 29 Ekim tatil mesai" : "",
      },
    });
    await prisma.puantajGun.createMany({
      data: gunler.map((g) => ({ puantajId: puantaj.id, ...g })),
    });
    const calisan = gunler.filter((g) => g.kod === "C");
    let tatilMesaiSaat = 0;
    let calismaSaat = 0;
    for (const g of calisan) {
      calismaSaat += g.saat;
      if (tatiller.has(tarihYaz(yil, ay, g.gun))) tatilMesaiSaat += g.saat;
    }
    const yemek = kisi.yer === "ŞANTİYE" ? 150 : 0;
    const yol = kisi.yer === "SAHA" || kisi.yer === "ŞANTİYE" ? 200 : 0;
    const ekOdemeManuel = kisi.yer === "ŞANTİYE" ? 1500 : kisi.yer === "ÜRETİM" ? 750 : 0;
    const sonuc = hesaplaBordro({
      netMaas: kisi.netMaas,
      resmiUcret: resmiTaban(RESMI),
      calismaSaat,
      calismaGun: calisan.length,
      normalAylikSaat: NORMAL_SAAT,
      mesaiCarpan: 1.5,
      mesaiCarpanTatil: 2,
      tatilMesaiSaat,
      avans: avansMap.get(id) ?? 0,
      otomKatilim: kisi.otomKatilimBedeli,
      icraKesinti: icraKesinti.get(id) ?? 0,
      ekOdemeManuel,
      besKesinti: kisi.besDurum === "VAR" ? 650 : 0,
      yemek,
      yol,
      prim: 0,
    });
    await prisma.bordro.create({
      data: { personelId: id, yil, ay, ...sonuc },
    });
  }

  for (const i of icraAy) {
    await prisma.icraDonem.create({
      data: { icraId: i.id, yil, ay, tutar: i.tutar },
    });
    await prisma.icra.update({
      where: { id: i.id },
      data: { odenen: i.odenen + i.tutar },
    });
  }

  await prisma.kullanici.createMany({
    data: [
      { ad: "Muhasebe", kullaniciAdi: "muhasebe", sifre: sifreHash("1234"), rol: "MUHASEBE" },
      { ad: "Saha şefi", kullaniciAdi: "saha", sifre: sifreHash("1234"), rol: "SAHA" },
    ],
  });

  console.log(`Dolduruldu: ${kayitlar.length} personel, Ekim 2026 puantaj + bordro.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

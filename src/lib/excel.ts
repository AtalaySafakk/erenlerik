import ExcelJS from "exceljs";
import { prisma } from "./prisma";
import { AYLAR, adSoyad, durumEtiket, para } from "./format";
import { ASGARI_NET, PUANTAJ_KODLARI, icraKesintiTutari, resmiTaban } from "./payroll";
import { gunSaati } from "./saat";

function baslik(ws: ExcelJS.Worksheet, kolonlar: string[]) {
  const row = ws.addRow(kolonlar);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF14221C" },
  };
  row.alignment = { vertical: "middle", wrapText: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

async function buffer(wb: ExcelJS.Workbook) {
  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data);
}

export async function personelExcel() {
  const liste = await prisma.personel.findMany({
    include: { gorevYeri: true, izinler: true, icralar: true },
    orderBy: [{ durum: "asc" }, { adi: "asc" }],
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Personel");
  baslik(ws, [
    "ADI",
    "SOYADI",
    "GÖREVYERİ",
    "CİNSİYET",
    "GÖREVİ",
    "TCKİMLİKNO",
    "İCRA DURUM",
    "HESAPNO",
    "İŞEBAŞLAMA TARİHİ",
    "D.TARİHİ",
    "NET MAAŞ",
    "RESMİ MAAŞ",
    "BESDURUM",
    "OTOM. KATILIM BEDELİ",
    "DURUMU",
    "İŞTEN AYRILIŞ TARİHİ",
    "YILLIK İZİN HK",
    "YILLIK KULLANILAN İZİN",
    "KALAN İZİN HAKKI",
    "İZİN DURUM",
    "ADRES",
    "SSKİŞYERİNO",
    "GSM TLF",
    "MEDENİ DURUM",
    "ÇOCUK SAYISI",
  ]);

  for (const p of liste) {
    const kullanilan = p.izinler
      .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
      .reduce((t, i) => t + i.gun, 0);
    const kalan = p.yillikIzinHakki - kullanilan;
    ws.addRow([
      p.adi,
      p.soyadi,
      p.gorevYeri.ad,
      p.cinsiyet,
      p.gorevi,
      p.tcKimlik,
      p.icraDurum,
      p.hesapNo,
      p.iseBaslamaTarihi,
      p.dogumTarihi,
      p.netMaas,
      p.resmiMaas,
      p.besDurum,
      p.otomKatilimBedeli,
      durumEtiket(p.durum),
      p.istenAyrilisTarihi,
      p.yillikIzinHakki,
      kullanilan,
      kalan,
      kalan > 0 ? "VAR" : "YOK",
      p.adres,
      p.sskIsyeriNo,
      p.gsm,
      p.medeniDurum,
      p.cocukSayisi,
    ]);
  }
  return buffer(wb);
}

export async function puantajExcel(yil: number, ay: number, gorevYeriId?: number) {
  const gunSayisi = new Date(yil, ay, 0).getDate();
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });
  const mola = ayar?.molaSaat ?? 1;
  const personeller = await prisma.personel.findMany({
    where: {
      durum: { not: "PASIF" },
      ...(gorevYeriId ? { gorevYeriId } : {}),
    },
    include: {
      gorevYeri: true,
      puantajlar: { where: { yil, ay }, include: { gunler: true } },
    },
    orderBy: [{ gorevYeriId: "asc" }, { adi: "asc" }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Puantaj ${AYLAR[ay - 1]} ${yil}`);
  const kolonlar = ["ADI", "SOYADI", "GÖREVYERİ", "GÖREVİ"];
  for (let g = 1; g <= gunSayisi; g++) kolonlar.push(String(g));
  kolonlar.push("Ç.GÜN", "SAAT", "FAZLA MESAİ");
  baslik(ws, kolonlar);

  for (const p of personeller) {
    const map = new Map((p.puantajlar[0]?.gunler ?? []).map((g) => [g.gun, g]));
    const degerler = [];
    let gun = 0;
    let saat = 0;
    for (let d = 1; d <= gunSayisi; d++) {
      const hucre = map.get(d);
      if (!hucre || hucre.kod === "B") {
        degerler.push("");
        continue;
      }
      if (hucre.kod === "C") {
        const gunluk = gunSaati(hucre, mola);
        degerler.push(
          hucre.giris && hucre.cikis ? `${hucre.giris}-${hucre.cikis}` : gunluk,
        );
        gun += 1;
        saat += gunluk;
      } else {
        degerler.push(PUANTAJ_KODLARI[hucre.kod as keyof typeof PUANTAJ_KODLARI]?.kisa ?? hucre.kod);
      }
    }
    ws.addRow([
      p.adi,
      p.soyadi,
      p.gorevYeri.ad,
      p.gorevi,
      ...degerler,
      gun,
      saat,
      Math.max(0, saat - 180),
    ]);
  }
  return buffer(wb);
}

export async function bordroExcel(yil: number, ay: number) {
  const liste = await prisma.bordro.findMany({
    where: { yil, ay },
    include: { personel: { include: { gorevYeri: true } } },
    orderBy: { id: "asc" },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Bordro ${AYLAR[ay - 1]} ${yil}`);
  baslik(ws, [
    "ADI",
    "SOYADI",
    "GÖREVYERİ",
    "Ç.GÜN",
    "SAAT",
    "FAZLA MESAİ SAAT",
    "NET MAAŞ",
    "RESMİ BODRO",
    "EKÖDEME",
    "AVANS",
    "OTOM. KATILIM",
    "İCRA",
    "BANKAYA YATACAK",
    "ELDEN ÖDENECEK",
  ]);
  for (const b of liste) {
    ws.addRow([
      b.personel.adi,
      b.personel.soyadi,
      b.personel.gorevYeri.ad,
      b.calismaGun,
      b.calismaSaat,
      b.fazlaMesaiSaat,
      b.netMaas,
      b.resmiUcret,
      b.ekOdeme,
      b.avans,
      b.otomKatilim,
      b.icraKesinti,
      b.bankayaYatacak,
      b.eldenOdenecek,
    ]);
  }
  return buffer(wb);
}

export async function izinExcel() {
  const liste = await prisma.personel.findMany({
    include: { gorevYeri: true, izinler: true },
    orderBy: { adi: "asc" },
  });
  const wb = new ExcelJS.Workbook();
  const ozet = wb.addWorksheet("İzin Özet");
  baslik(ozet, [
    "ADI SOYADI",
    "GÖREVYERİ",
    "YILLIK İZİN HK",
    "KULLANILAN",
    "KALAN",
    "İZİN DURUM",
  ]);
  for (const p of liste) {
    const kullanilan = p.izinler
      .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
      .reduce((t, i) => t + i.gun, 0);
    ozet.addRow([
      adSoyad(p),
      p.gorevYeri.ad,
      p.yillikIzinHakki,
      kullanilan,
      p.yillikIzinHakki - kullanilan,
      p.yillikIzinHakki - kullanilan > 0 ? "VAR" : "YOK",
    ]);
  }

  const hareket = wb.addWorksheet("İzin Hareket");
  baslik(hareket, ["ADI SOYADI", "TİP", "BAŞLANGIÇ", "BİTİŞ", "GÜN", "DURUM", "AÇIKLAMA"]);
  for (const p of liste) {
    for (const i of p.izinler) {
      hareket.addRow([adSoyad(p), i.tip, i.baslangic, i.bitis, i.gun, i.durum, i.aciklama]);
    }
  }
  return buffer(wb);
}

export async function icraExcel() {
  const liste = await prisma.icra.findMany({
    include: { personel: { include: { gorevYeri: true } } },
    orderBy: { id: "desc" },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("İcra");
  baslik(ws, [
    "ADI SOYADI",
    "GÖREVYERİ",
    "DOSYA NO",
    "ALACAKLI",
    "TUTAR",
    "KESİNTİ TÜRÜ",
    "YÜZDE",
    "AYLIK KESİNTİ",
    "ÖDENEN",
    "KALAN",
    "BAŞLANGIÇ",
    "BİTİŞ",
    "DURUM",
  ]);
  for (const i of liste) {
    ws.addRow([
      adSoyad(i.personel),
      i.personel.gorevYeri.ad,
      i.dosyaNo,
      i.alacakli,
      para(i.tutar),
      i.kesintiTip === "YUZDE" ? "YÜZDE" : "TUTAR",
      i.kesintiTip === "YUZDE" ? para(i.kesintiYuzde) : "",
      para(icraKesintiTutari(i, i.personel.netMaas)),
      para(i.odenen),
      para(i.tutar - i.odenen),
      i.baslangic,
      i.bitis,
      i.aktif ? "AKTİF" : "KAPALI",
    ]);
  }
  return buffer(wb);
}

export async function bankaExcel(yil: number, ay: number) {
  const liste = await prisma.bordro.findMany({
    where: { yil, ay },
    include: { personel: true },
    orderBy: { id: "asc" },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Banka ${AYLAR[ay - 1]} ${yil}`);
  baslik(ws, ["ADI", "SOYADI", "HESAPNO", "BANKAYA YATACAK", "İCRA", "BES"]);
  for (const b of liste) {
    ws.addRow([
      b.personel.adi,
      b.personel.soyadi,
      b.personel.hesapNo,
      b.bankayaYatacak,
      b.icraKesinti,
      b.besKesinti,
    ]);
  }
  return buffer(wb);
}

export async function masterExcel(yil: number, ay: number) {
  const liste = await prisma.personel.findMany({
    include: {
      gorevYeri: true,
      izinler: true,
      icralar: true,
      bordrolar: { where: { yil, ay } },
    },
    orderBy: [{ gorevYeriId: "asc" }, { adi: "asc" }],
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Personel Bordro");
  baslik(ws, [
    "ADI",
    "SOYADI",
    "GÖREVYERİ",
    "CİNSİYET",
    "GÖREVİ",
    "TCKİMLİKNO",
    "İCRA DURUM",
    "HESAPNO",
    "İŞEBAŞLAMA TARİHİ",
    "Ç.GÜN",
    "D.TARİHİ",
    "NET MAAŞ",
    "EKÖDEME",
    "BESDURUM",
    "BANKAYA YATACAK",
    "AVANS",
    "OTOM. KATILIM BEDELİ",
    "ELDEN ÖDENECEK",
    "DURUMU (AKTİF/PASİF)",
    "İŞTEN AYRILIŞ TARİHİ",
    "YILLIK İZİN HK",
    "YILLIK KULLANILAN İZİN",
    "KALAN İZİN HAKKI",
    "İZİN DURUM",
    "ADRES",
    "SSKİŞYERİNO",
    "GSM TLF",
    "MEDENİ DURUM",
    "ÇOCUK SAYISI",
  ]);
  for (const p of liste) {
    const b = p.bordrolar[0];
    const kullanilan = p.izinler
      .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
      .reduce((t, i) => t + i.gun, 0);
    const kalan = p.yillikIzinHakki - kullanilan;
    ws.addRow([
      p.adi,
      p.soyadi,
      p.gorevYeri.ad,
      p.cinsiyet,
      p.gorevi,
      p.tcKimlik,
      p.icraDurum,
      p.hesapNo,
      p.iseBaslamaTarihi,
      b?.calismaGun ?? "",
      p.dogumTarihi,
      b?.netMaas ?? p.netMaas,
      b?.ekOdeme ?? p.ekOdeme,
      p.besDurum,
      b?.bankayaYatacak ?? "",
      b?.avans ?? "",
      p.otomKatilimBedeli,
      b?.eldenOdenecek ?? "",
      durumEtiket(p.durum),
      p.istenAyrilisTarihi,
      p.yillikIzinHakki,
      kullanilan,
      kalan,
      kalan > 0 ? "VAR" : "YOK",
      p.adres,
      p.sskIsyeriNo,
      p.gsm,
      p.medeniDurum,
      p.cocukSayisi,
    ]);
  }
  return buffer(wb);
}

function hucreMetin(v: unknown) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function hucreSayi(v: unknown) {
  const s = hucreMetin(v).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function anahtar(v: unknown) {
  return hucreMetin(v)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C");
}

export async function personelIceriAktar(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { eklenen: 0, guncellenen: 0 };

  const header: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => {
    header[anahtar(cell.value)] = col;
  });
  const col = (names: string[]) => {
    for (const n of names) {
      if (header[anahtar(n)]) return header[anahtar(n)];
    }
    return 0;
  };

  const cAdi = col(["ADI", "AD"]);
  const cSoyadi = col(["SOYADI"]);
  const cYer = col(["GÖREVYERİ", "GOREVYERI", "GÖREV YERİ"]);
  const cCinsiyet = col(["CİNSİYET", "CINSIYET"]);
  const cGorevi = col(["GÖREVİ", "GOREVI"]);
  const cTc = col(["TCKİMLİKNO", "TCKIMLIKNO", "TC"]);
  const cIcra = col(["İCRA DURUM", "ICRA DURUM", "ICRADURUM"]);
  const cHesap = col(["HESAPNO", "HESAP NO"]);
  const cIse = col(["İŞEBAŞLAMA TARİHİ", "ISEBASLAMA"]);
  const cDogum = col(["D.TARİHİ", "DTARIHI", "DOĞUM"]);
  const cMaas = col(["NET MAAŞ", "NETMAAS"]);
  const cResmi = col(["RESMİ MAAŞ", "RESMI MAAS", "RESMİMAAŞ"]);
  const cBes = col(["BESDURUM", "BES"]);
  const cOtom = col(["OTOM. KATILIM BEDELİ", "OTOMKATILIM"]);
  const cDurum = col(["DURUMU (AKTİF/PASİF)", "DURUMU", "DURUM"]);
  const cAyrilis = col(["İŞTEN AYRILIŞ TARİHİ", "AYRILIS"]);
  const cIzin = col(["YILLIK İZİN HK", "YILLIKIZINHK"]);
  const cAdres = col(["ADRES"]);
  const cSsk = col(["SSKİŞYERİNO", "SSKISYERINO"]);
  const cGsm = col(["GSM TLF", "GSM"]);
  const cMedeni = col(["MEDENİ DURUM", "MEDENI DURUM"]);
  const cCocuk = col(["ÇOCUK SAYISI", "COCUK SAYISI"]);

  let eklenen = 0;
  let guncellenen = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const adi = hucreMetin(cAdi ? row.getCell(cAdi).value : "");
    const soyadi = hucreMetin(cSoyadi ? row.getCell(cSoyadi).value : "");
    if (!adi || !soyadi) continue;

    const yerAd = hucreMetin(cYer ? row.getCell(cYer).value : "") || "OFİS";
    const yer = await prisma.gorevYeri.upsert({
      where: { ad: yerAd.toUpperCase() },
      update: {},
      create: { ad: yerAd.toUpperCase() },
    });

    const data = {
      adi,
      soyadi,
      gorevYeriId: yer.id,
      cinsiyet: hucreMetin(cCinsiyet ? row.getCell(cCinsiyet).value : "") || "BAY",
      gorevi: hucreMetin(cGorevi ? row.getCell(cGorevi).value : ""),
      tcKimlik: hucreMetin(cTc ? row.getCell(cTc).value : ""),
      icraDurum: hucreMetin(cIcra ? row.getCell(cIcra).value : "") || "ICRAYOK",
      hesapNo: hucreMetin(cHesap ? row.getCell(cHesap).value : ""),
      iseBaslamaTarihi: hucreMetin(cIse ? row.getCell(cIse).value : ""),
      dogumTarihi: hucreMetin(cDogum ? row.getCell(cDogum).value : ""),
      netMaas: hucreSayi(cMaas ? row.getCell(cMaas).value : 0),
      resmiMaas: resmiTaban(hucreSayi(cResmi ? row.getCell(cResmi).value : 0) || ASGARI_NET),
      besDurum: hucreMetin(cBes ? row.getCell(cBes).value : "") || "YOK",
      otomKatilimBedeli: hucreSayi(cOtom ? row.getCell(cOtom).value : 0),
      durum: hucreMetin(cDurum ? row.getCell(cDurum).value : "").toUpperCase().includes("PASIF")
        ? "PASIF"
        : "AKTIF",
      istenAyrilisTarihi: hucreMetin(cAyrilis ? row.getCell(cAyrilis).value : ""),
      yillikIzinHakki: hucreSayi(cIzin ? row.getCell(cIzin).value : 14) || 14,
      adres: hucreMetin(cAdres ? row.getCell(cAdres).value : ""),
      sskIsyeriNo: hucreMetin(cSsk ? row.getCell(cSsk).value : ""),
      gsm: hucreMetin(cGsm ? row.getCell(cGsm).value : ""),
      medeniDurum: hucreMetin(cMedeni ? row.getCell(cMedeni).value : ""),
      cocukSayisi: hucreSayi(cCocuk ? row.getCell(cCocuk).value : 0),
    };

    const mevcut = data.tcKimlik
      ? await prisma.personel.findFirst({ where: { tcKimlik: data.tcKimlik } })
      : await prisma.personel.findFirst({ where: { adi, soyadi } });

    if (mevcut) {
      await prisma.personel.update({ where: { id: mevcut.id }, data });
      guncellenen += 1;
    } else {
      await prisma.personel.create({ data });
      eklenen += 1;
    }
  }

  return { eklenen, guncellenen };
}

function saatHucre(v: unknown) {
  if (v instanceof Date) {
    return `${String(v.getHours()).padStart(2, "0")}:${String(v.getMinutes()).padStart(2, "0")}`;
  }
  const t = hucreMetin(v);
  const m = t.match(/^(\d{1,2})[:.](\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t;
}

export async function pdksIceriAktar(buf: Buffer) {
  const { calismaSaati } = await import("./saat");
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });
  const mola = ayar?.molaSaat ?? 1;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { islenen: 0 };

  const header: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => {
    header[anahtar(cell.value)] = col;
  });
  const col = (names: string[]) => {
    for (const n of names) if (header[anahtar(n)]) return header[anahtar(n)];
    return 0;
  };
  const cTc = col(["TCKIMLIKNO", "TC", "TCKIMLIK"]);
  const cAdi = col(["ADI", "AD"]);
  const cSoyadi = col(["SOYADI"]);
  const cTarih = col(["TARIH", "GUN"]);
  const cGiris = col(["GIRIS", "GIRISSAATI"]);
  const cCikis = col(["CIKIS", "CIKISSAATI"]);

  let islenen = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const tarih = hucreMetin(cTarih ? row.getCell(cTarih).value : "");
    const giris = saatHucre(cGiris ? row.getCell(cGiris).value : "");
    const cikis = saatHucre(cCikis ? row.getCell(cCikis).value : "");
    if (!tarih || !giris || !cikis) continue;
    const d = new Date(tarih);
    if (Number.isNaN(d.getTime())) continue;
    const yil = d.getFullYear();
    const ay = d.getMonth() + 1;
    const gun = d.getDate();
    const tc = hucreMetin(cTc ? row.getCell(cTc).value : "");
    const adi = hucreMetin(cAdi ? row.getCell(cAdi).value : "");
    const soyadi = hucreMetin(cSoyadi ? row.getCell(cSoyadi).value : "");
    const p = tc
      ? await prisma.personel.findFirst({ where: { tcKimlik: tc } })
      : await prisma.personel.findFirst({ where: { adi, soyadi } });
    if (!p) continue;
    const puantaj = await prisma.puantaj.upsert({
      where: { personelId_yil_ay: { personelId: p.id, yil, ay } },
      update: {},
      create: { personelId: p.id, yil, ay },
    });
    const yer = await prisma.gorevYeri.findUnique({ where: { id: p.gorevYeriId } });
    const m = yer?.molaSaat && yer.molaSaat > 0 ? yer.molaSaat : mola;
    await prisma.puantajGun.upsert({
      where: { puantajId_gun: { puantajId: puantaj.id, gun } },
      update: {
        kod: "C",
        giris,
        cikis,
        saat: calismaSaati(giris, cikis, m),
        kaynak: "PDKS",
      },
      create: {
        puantajId: puantaj.id,
        gun,
        kod: "C",
        giris,
        cikis,
        saat: calismaSaati(giris, cikis, m),
        kaynak: "PDKS",
      },
    });
    islenen += 1;
  }
  return { islenen };
}

export async function sgkExcel(yil: number, ay: number) {
  const liste = await prisma.personel.findMany({
    include: {
      gorevYeri: true,
      bordrolar: { where: { yil, ay } },
    },
    orderBy: { adi: "asc" },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`SGK ${AYLAR[ay - 1]} ${yil}`);
  baslik(ws, [
    "TCKİMLİKNO",
    "ADI",
    "SOYADI",
    "SSKİŞYERİNO",
    "İŞE BAŞLAMA",
    "İŞTEN AYRILIŞ",
    "GÜN",
    "SAAT",
    "DURUM",
  ]);
  for (const p of liste) {
    const b = p.bordrolar[0];
    ws.addRow([
      p.tcKimlik,
      p.adi,
      p.soyadi,
      p.sskIsyeriNo,
      p.iseBaslamaTarihi,
      p.istenAyrilisTarihi,
      b?.calismaGun ?? "",
      b?.calismaSaat ?? "",
      durumEtiket(p.durum),
    ]);
  }
  return buffer(wb);
}

export async function eldenExcel(yil: number, ay: number) {
  const liste = await prisma.bordro.findMany({
    where: { yil, ay },
    include: { personel: { include: { gorevYeri: true } } },
    orderBy: { id: "asc" },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Elden ${AYLAR[ay - 1]} ${yil}`);
  baslik(ws, ["ADI", "SOYADI", "GÖREVYERİ", "ELDEN", "ÖDENDİ", "İMZA", "TARİH"]);
  for (const b of liste) {
    ws.addRow([
      b.personel.adi,
      b.personel.soyadi,
      b.personel.gorevYeri.ad,
      para(b.eldenOdenecek),
      b.eldenOdendi ? "EVET" : "HAYIR",
      b.eldenImza ? "İMZA" : "",
      b.eldenOdemeTarihi,
    ]);
  }
  return buffer(wb);
}

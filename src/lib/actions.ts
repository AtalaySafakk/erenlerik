"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import {
  ASGARI_NET,
  hesaplaBordro,
  icraKesintiTutari,
  izinKodu,
  parseTatiller,
  resmiTaban,
  round2,
  tarihYaz,
} from "./payroll";
import { ayGunSayisi, izinTarihleri } from "./format";
import { calismaSaati, gunSaati } from "./saat";
import { pdksIceriAktar, personelIceriAktar } from "./excel";
import { oturumAc, oturumKapat } from "./auth";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

function n(v: FormDataEntryValue | null) {
  return Number(String(v ?? "0").replace(",", ".")) || 0;
}

function s(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function yenile() {
  revalidatePath("/");
  revalidatePath("/personel");
  revalidatePath("/puantaj");
  revalidatePath("/giris-cikis");
  revalidatePath("/bordro");
  revalidatePath("/izin");
  revalidatePath("/icra");
  revalidatePath("/mazeret");
  revalidatePath("/raporlar");
  revalidatePath("/ayarlar");
  revalidatePath("/kasa");
  revalidatePath("/avans");
}

export async function personelKaydet(formData: FormData) {
  const id = s(formData.get("id"));
  const data = {
    adi: s(formData.get("adi")),
    soyadi: s(formData.get("soyadi")),
    gorevYeriId: n(formData.get("gorevYeriId")),
    cinsiyet: s(formData.get("cinsiyet")) || "BAY",
    gorevi: s(formData.get("gorevi")),
    tcKimlik: s(formData.get("tcKimlik")),
    icraDurum: s(formData.get("icraDurum")) || "ICRAYOK",
    hesapNo: s(formData.get("hesapNo")),
    iseBaslamaTarihi: s(formData.get("iseBaslamaTarihi")),
    dogumTarihi: s(formData.get("dogumTarihi")),
    netMaas: n(formData.get("netMaas")),
    resmiMaas: resmiTaban(n(formData.get("resmiMaas"))),
    ekOdeme: n(formData.get("ekOdeme")),
    yemek: n(formData.get("yemek")),
    yol: n(formData.get("yol")),
    prim: n(formData.get("prim")),
    yemekHedef: s(formData.get("yemekHedef")) || "ELDEN",
    yolHedef: s(formData.get("yolHedef")) || "ELDEN",
    primHedef: s(formData.get("primHedef")) || "ELDEN",
    denemeBitis: s(formData.get("denemeBitis")),
    sozlesmeBitis: s(formData.get("sozlesmeBitis")),
    besDurum: s(formData.get("besDurum")) || "YOK",
    besKesinti: n(formData.get("besKesinti")),
    otomKatilimBedeli: n(formData.get("otomKatilimBedeli")),
    durum: s(formData.get("durum")) || "AKTIF",
    istenAyrilisTarihi: s(formData.get("istenAyrilisTarihi")),
    yillikIzinHakki: n(formData.get("yillikIzinHakki")),
    adres: s(formData.get("adres")),
    sskIsyeriNo: s(formData.get("sskIsyeriNo")),
    gsm: s(formData.get("gsm")),
    medeniDurum: s(formData.get("medeniDurum")),
    cocukSayisi: n(formData.get("cocukSayisi")),
  };

  if (!data.adi || !data.soyadi || !data.gorevYeriId) {
    return { ok: false, hata: "Ad, soyad ve görev yeri zorunlu." };
  }

  if (id) {
    await prisma.personel.update({ where: { id: Number(id) }, data });
  } else {
    await prisma.personel.create({ data });
  }

  yenile();
  return { ok: true };
}

export async function personelSil(id: number) {
  await prisma.personel.delete({ where: { id } });
  yenile();
}

export async function gorevYeriEkle(formData: FormData) {
  const ad = s(formData.get("ad")).toUpperCase();
  if (!ad) return;
  await prisma.gorevYeri.upsert({
    where: { ad },
    update: {},
    create: { ad },
  });
  yenile();
}

export async function gorevYeriVardiyaKaydet(formData: FormData) {
  await prisma.gorevYeri.update({
    where: { id: n(formData.get("id")) },
    data: {
      varsayilanGiris: s(formData.get("varsayilanGiris")),
      varsayilanCikis: s(formData.get("varsayilanCikis")),
      molaSaat: n(formData.get("molaSaat")),
    },
  });
  yenile();
}

export async function ayarKaydet(formData: FormData) {
  const data = {
    firmaAdi: s(formData.get("firmaAdi")) || "İK Program",
    resmiUcret: resmiTaban(n(formData.get("resmiUcret"))),
    normalAylikSaat: n(formData.get("normalAylikSaat")),
    tamAyGun: n(formData.get("tamAyGun")) || 26,
    mesaiCarpan: n(formData.get("mesaiCarpan")) || 1.5,
    mesaiCarpanTatil: n(formData.get("mesaiCarpanTatil")) || 2,
    varsayilanGunSaat: n(formData.get("varsayilanGunSaat")),
    varsayilanGiris: s(formData.get("varsayilanGiris")) || "08:00",
    varsayilanCikis: s(formData.get("varsayilanCikis")) || "16:30",
    molaSaat: n(formData.get("molaSaat")),
  };
  await prisma.ayar.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  yenile();
}

export async function resmiTatilleriKaydet(tarihler: string[]) {
  const resmiTatiller = [...new Set(tarihler.filter(Boolean))].sort().join(",");
  await prisma.ayar.upsert({
    where: { id: 1 },
    update: { resmiTatiller },
    create: { id: 1, resmiTatiller },
  });
  yenile();
}

export async function puantajKaydet(payload: {
  yil: number;
  ay: number;
  satirlar: {
    personelId: number;
    gunler: { gun: number; saat: number; kod: string; giris?: string; cikis?: string }[];
  }[];
}) {
  for (const satir of payload.satirlar) {
    const kayit = await prisma.puantaj.upsert({
      where: {
        personelId_yil_ay: {
          personelId: satir.personelId,
          yil: payload.yil,
          ay: payload.ay,
        },
      },
      update: {},
      create: { personelId: satir.personelId, yil: payload.yil, ay: payload.ay },
    });

    if (!satir.gunler.length) continue;
    await prisma.puantajGun.deleteMany({ where: { puantajId: kayit.id } });
    await prisma.puantajGun.createMany({
      data: satir.gunler.map((g) => ({
        puantajId: kayit.id,
        gun: g.gun,
        saat: g.saat,
        giris: g.giris ?? "",
        cikis: g.cikis ?? "",
        kod: g.kod || "B",
      })),
    });
  }

  yenile();
  return { ok: true };
}

export async function girisCikisKaydet(payload: {
  yil: number;
  ay: number;
  personelId: number;
  gunler: { gun: number; giris: string; cikis: string }[];
}) {
  const [ayar, personel] = await Promise.all([
    prisma.ayar.findUnique({ where: { id: 1 } }),
    prisma.personel.findUnique({
      where: { id: payload.personelId },
      include: { gorevYeri: true },
    }),
  ]);
  const yerMola = personel?.gorevYeri.molaSaat ?? 0;
  const mola = yerMola > 0 ? yerMola : (ayar?.molaSaat ?? 1);
  const kayit = await puantajGetirVeyaAc(payload.personelId, payload.yil, payload.ay);
  const mevcutlar = await prisma.puantajGun.findMany({ where: { puantajId: kayit.id } });
  const map = new Map(mevcutlar.map((g) => [g.gun, g]));

  for (const g of payload.gunler) {
    const mevcut = map.get(g.gun);
    if (mevcut && mevcut.kod !== "C" && mevcut.kod !== "B") continue;
    const giris = g.giris ?? "";
    const cikis = g.cikis ?? "";
    if (!giris || !cikis) {
      if (mevcut?.kod === "C") {
        await hucreYaz(kayit.id, g.gun, "C", mevcut.saat, "", "");
      }
      continue;
    }
    await hucreYaz(kayit.id, g.gun, "C", calismaSaati(giris, cikis, mola), giris, cikis);
  }

  yenile();
  return { ok: true };
}

async function puantajGetirVeyaAc(personelId: number, yil: number, ay: number) {
  return prisma.puantaj.upsert({
    where: { personelId_yil_ay: { personelId, yil, ay } },
    update: {},
    create: { personelId, yil, ay },
  });
}

async function hucreYaz(
  puantajId: number,
  gun: number,
  kod: string,
  saat: number,
  giris = "",
  cikis = "",
  kaynak = "MANUEL",
) {
  await prisma.puantajGun.upsert({
    where: { puantajId_gun: { puantajId, gun } },
    update: { kod, saat, giris, cikis, kaynak },
    create: { puantajId, gun, kod, saat, giris, cikis, kaynak },
  });
}

export async function puantajOncekiAyKopyala(yil: number, ay: number, gorevYeriId?: number) {
  const oncekiAy = ay === 1 ? 12 : ay - 1;
  const oncekiYil = ay === 1 ? yil - 1 : yil;
  const personeller = await prisma.personel.findMany({
    where: {
      durum: { not: "PASIF" },
      ...(gorevYeriId ? { gorevYeriId } : {}),
    },
    include: {
      puantajlar: { where: { yil: oncekiYil, ay: oncekiAy }, include: { gunler: true } },
    },
  });
  const gunLimit = ayGunSayisi(yil, ay);
  for (const p of personeller) {
    const kaynak = p.puantajlar[0];
    if (!kaynak) continue;
    const hedef = await puantajGetirVeyaAc(p.id, yil, ay);
    await prisma.puantajGun.deleteMany({ where: { puantajId: hedef.id } });
    await prisma.puantajGun.createMany({
      data: kaynak.gunler
        .filter((g) => g.gun <= gunLimit)
        .map((g) => ({
          puantajId: hedef.id,
          gun: g.gun,
          saat: g.saat,
          giris: g.giris,
          cikis: g.cikis,
          kod: g.kod,
        })),
    });
  }
  yenile();
  return { ok: true };
}

async function resmiTatilKumesi() {
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });
  return parseTatiller(ayar?.resmiTatiller);
}

function izinYazilacakGunler(tip: string, baslangic: string, bitis: string, tatiller: string[]) {
  return izinTarihleri(baslangic, bitis, {
    sadeceIsGunleri: tip === "YILLIK",
    tatiller,
  });
}

export async function puantajIzinleriIsle(yil: number, ay: number, gorevYeriId?: number) {
  const bas = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const sonGun = ayGunSayisi(yil, ay);
  const bit = `${yil}-${String(ay).padStart(2, "0")}-${String(sonGun).padStart(2, "0")}`;
  const tatiller = await resmiTatilKumesi();
  const personeller = await prisma.personel.findMany({
    where: {
      durum: { not: "PASIF" },
      ...(gorevYeriId ? { gorevYeriId } : {}),
    },
    include: {
      izinler: { where: { durum: "ONAYLANDI" } },
    },
  });

  for (const p of personeller) {
    const ilgili = p.izinler.filter((i) => i.baslangic <= bit && i.bitis >= bas);
    if (!ilgili.length) continue;
    const kayit = await puantajGetirVeyaAc(p.id, yil, ay);
    for (const izin of ilgili) {
      for (const t of izinYazilacakGunler(izin.tip, izin.baslangic, izin.bitis, tatiller)) {
        const [gy, gm, gg] = t.split("-").map(Number);
        if (gy !== yil || gm !== ay) continue;
        await hucreYaz(kayit.id, gg, izinKodu(izin.tip), 0);
      }
    }
  }
  yenile();
  return { ok: true };
}

export async function izinKaydet(formData: FormData) {
  const personelId = n(formData.get("personelId"));
  const tip = s(formData.get("tip")) || "YILLIK";
  const baslangic = s(formData.get("baslangic"));
  const bitis = s(formData.get("bitis"));
  const tatiller = tip === "YILLIK" ? await resmiTatilKumesi() : [];
  const yazilacak = izinYazilacakGunler(tip, baslangic, bitis, tatiller);
  await prisma.izin.create({
    data: {
      personelId,
      tip,
      baslangic,
      bitis,
      gun: yazilacak.length,
      aciklama: s(formData.get("aciklama")),
      durum: s(formData.get("durum")) || "ONAYLANDI",
    },
  });

  for (const t of yazilacak) {
    const [yil, ay, gun] = t.split("-").map(Number);
    const kayit = await puantajGetirVeyaAc(personelId, yil, ay);
    await hucreYaz(kayit.id, gun, izinKodu(tip), 0);
  }
  yenile();
}

export async function izinSil(id: number) {
  await prisma.izin.delete({ where: { id } });
  yenile();
}

export async function icraKaydet(formData: FormData) {
  const personelId = n(formData.get("personelId"));
  const kesintiTip = s(formData.get("kesintiTip")) === "YUZDE" ? "YUZDE" : "TUTAR";
  await prisma.icra.create({
    data: {
      personelId,
      dosyaNo: s(formData.get("dosyaNo")),
      alacakli: s(formData.get("alacakli")),
      tutar: n(formData.get("tutar")),
      kesintiTip,
      kesinti: kesintiTip === "TUTAR" ? n(formData.get("kesinti")) : 0,
      kesintiYuzde: kesintiTip === "YUZDE" ? n(formData.get("kesintiYuzde")) : 0,
      odenen: n(formData.get("odenen")),
      baslangic: s(formData.get("baslangic")),
      bitis: s(formData.get("bitis")),
      aktif: s(formData.get("aktif")) !== "hayir",
    },
  });
  await prisma.personel.update({
    where: { id: personelId },
    data: { icraDurum: "ICRAVAR" },
  });
  yenile();
}

export async function icraDurumDegistir(id: number, aktif: boolean) {
  const kayit = await prisma.icra.update({ where: { id }, data: { aktif } });
  const acik = await prisma.icra.count({
    where: { personelId: kayit.personelId, aktif: true },
  });
  await prisma.personel.update({
    where: { id: kayit.personelId },
    data: { icraDurum: acik ? "ICRAVAR" : "ICRAYOK" },
  });
  yenile();
}

export async function avansKaydet(formData: FormData) {
  await prisma.avans.create({
    data: {
      personelId: n(formData.get("personelId")),
      yil: n(formData.get("yil")),
      ay: n(formData.get("ay")),
      tutar: n(formData.get("tutar")),
      aciklama: s(formData.get("aciklama")),
      tarih: s(formData.get("tarih")) || new Date().toISOString().slice(0, 10),
    },
  });
  yenile();
}

export async function avansSil(id: number) {
  await prisma.avans.delete({ where: { id } });
  yenile();
}

export async function bordroHesapla(yil: number, ay: number, gorevYeriId?: number) {
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });
  const asgari = ayar?.resmiUcret ?? ASGARI_NET;
  const normalAylikSaat = ayar?.normalAylikSaat ?? 180;
  const mesaiCarpan = ayar?.mesaiCarpan ?? 1.5;
  const mesaiCarpanTatil = ayar?.mesaiCarpanTatil ?? 2;
  const tatiller = new Set(parseTatiller(ayar?.resmiTatiller));
  const mola = ayar?.molaSaat ?? 1;

  const personeller = await prisma.personel.findMany({
    where: {
      durum: { not: "PASIF" },
      ...(gorevYeriId ? { gorevYeriId } : {}),
    },
    include: {
      gorevYeri: true,
      puantajlar: {
        where: { yil, ay },
        include: { gunler: true },
      },
      avanslar: { where: { yil, ay } },
      icralar: { include: { donemler: { where: { yil, ay } } } },
    },
  });

  const gunLimit = ayGunSayisi(yil, ay);

  for (const p of personeller) {
    const yerMola = p.gorevYeri.molaSaat > 0 ? p.gorevYeri.molaSaat : mola;
    const gunler = p.puantajlar[0]?.gunler ?? [];
    const calisan = gunler.filter((g) => g.kod === "C" && g.gun <= gunLimit);
    const calismaGun = calisan.length;
    let tatilMesaiSaat = 0;
    let calismaSaat = 0;
    for (const g of calisan) {
      const saat = gunSaati(g, yerMola);
      calismaSaat += saat;
      if (tatiller.has(tarihYaz(yil, ay, g.gun))) tatilMesaiSaat += saat;
    }
    const avans = p.avanslar.reduce((t, a) => t + a.tutar, 0);

    let icraKesinti = 0;
    for (const i of p.icralar) {
      const buAy = i.donemler[0];
      const bazOdenen = round2(i.odenen - (buAy?.tutar ?? 0));
      const kalan = round2(i.tutar - bazOdenen);
      const tamamenOdendi = i.odenen + 0.009 >= i.tutar;
      const ham = i.aktif || (tamamenOdendi && buAy) ? icraKesintiTutari(i, p.netMaas) : 0;
      const kes = round2(Math.max(0, Math.min(ham, Math.max(0, kalan))));
      icraKesinti += kes;
      await prisma.icraDonem.upsert({
        where: { icraId_yil_ay: { icraId: i.id, yil, ay } },
        update: { tutar: kes },
        create: { icraId: i.id, yil, ay, tutar: kes },
      });
      const yeniOdenen = round2(bazOdenen + kes);
      await prisma.icra.update({
        where: { id: i.id },
        data: {
          odenen: yeniOdenen,
          aktif: yeniOdenen + 0.009 < i.tutar,
        },
      });
    }

    const sonuc = hesaplaBordro({
      netMaas: p.netMaas,
      resmiUcret: resmiTaban(p.resmiMaas || asgari, asgari),
      calismaSaat,
      calismaGun,
      normalAylikSaat,
      mesaiCarpan,
      mesaiCarpanTatil,
      tatilMesaiSaat,
      avans,
      otomKatilim: p.otomKatilimBedeli,
      icraKesinti,
      ekOdemeManuel: p.ekOdeme,
      besKesinti: p.besDurum === "VAR" ? p.besKesinti : 0,
      yemek: p.yemek,
      yol: p.yol,
      prim: p.prim,
      yemekHedef: p.yemekHedef,
      yolHedef: p.yolHedef,
      primHedef: p.primHedef,
    });

    await prisma.bordro.upsert({
      where: { personelId_yil_ay: { personelId: p.id, yil, ay } },
      update: sonuc,
      create: { personelId: p.id, yil, ay, ...sonuc },
    });

    const acik = await prisma.icra.count({ where: { personelId: p.id, aktif: true } });
    await prisma.personel.update({
      where: { id: p.id },
      data: { icraDurum: acik ? "ICRAVAR" : "ICRAYOK" },
    });
  }

  yenile();
  return { ok: true, adet: personeller.length };
}

export async function personelExcelYukle(formData: FormData) {
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { ok: false, hata: "Excel seçilmedi." };
  }
  const buf = Buffer.from(await dosya.arrayBuffer());
  const sonuc = await personelIceriAktar(buf);
  yenile();
  return { ok: true, ...sonuc };
}

export async function resmiTatilListesi() {
  const ayar = await prisma.ayar.findUnique({ where: { id: 1 } });
  return parseTatiller(ayar?.resmiTatiller);
}

export async function girisCikisTopluKaydet(payload: {
  yil: number;
  ay: number;
  satirlar: { personelId: number; gun: number; giris: string; cikis: string }[];
}) {
  const grup = new Map<number, { gun: number; giris: string; cikis: string }[]>();
  for (const s of payload.satirlar) {
    const liste = grup.get(s.personelId) ?? [];
    liste.push({ gun: s.gun, giris: s.giris, cikis: s.cikis });
    grup.set(s.personelId, liste);
  }
  for (const [personelId, gunler] of grup) {
    await girisCikisKaydet({ yil: payload.yil, ay: payload.ay, personelId, gunler });
  }
  return { ok: true };
}

export async function kasaIsaret(formData: FormData) {
  const id = n(formData.get("id"));
  const alan = s(formData.get("alan"));
  const b = await prisma.bordro.findUnique({ where: { id } });
  if (!b) return;
  if (alan === "imza") {
    await prisma.bordro.update({ where: { id }, data: { eldenImza: !b.eldenImza } });
  } else {
    const odendi = !b.eldenOdendi;
    await prisma.bordro.update({
      where: { id },
      data: {
        eldenOdendi: odendi,
        eldenOdemeTarihi: odendi ? new Date().toISOString().slice(0, 10) : "",
      },
    });
  }
  yenile();
}

export async function belgeYukle(formData: FormData) {
  const personelId = n(formData.get("personelId"));
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { ok: false, hata: "Dosya yok." };
  const klasor = path.join(process.cwd(), "uploads", "belgeler");
  await mkdir(klasor, { recursive: true });
  const uzanti = path.extname(dosya.name) || "";
  const ad = `${personelId}-${Date.now()}${uzanti}`;
  await writeFile(path.join(klasor, ad), Buffer.from(await dosya.arrayBuffer()));
  await prisma.belge.create({
    data: {
      personelId,
      tip: s(formData.get("tip")) || "DIGER",
      ad: dosya.name,
      yol: ad,
    },
  });
  yenile();
  return { ok: true };
}

export async function belgeSil(id: number) {
  const b = await prisma.belge.findUnique({ where: { id } });
  if (!b) return;
  await unlink(path.join(process.cwd(), "uploads", "belgeler", b.yol)).catch(() => undefined);
  await prisma.belge.delete({ where: { id } });
  yenile();
}

export async function pdksYukle(formData: FormData) {
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { ok: false, hata: "Excel seçilmedi." };
  const sonuc = await pdksIceriAktar(Buffer.from(await dosya.arrayBuffer()));
  yenile();
  return { ok: true, ...sonuc };
}

export async function girisYap(formData: FormData) {
  const k = await oturumAc(s(formData.get("kullaniciAdi")), s(formData.get("sifre")));
  if (!k) return { ok: false, hata: "Kullanıcı veya şifre hatalı." };
  return { ok: true, rol: k.rol };
}

export async function cikisYap() {
  await oturumKapat();
}

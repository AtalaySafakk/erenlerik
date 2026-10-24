import { GirisCikisTablo } from "@/components/giris-cikis-tablo";
import { GirisCikisToplu } from "@/components/giris-cikis-toplu";
import { PageHead } from "@/components/page-head";
import { FieldSelect } from "@/components/field-select";
import { prisma } from "@/lib/prisma";
import { AYLAR, adSoyad, ayGunSayisi, haftaGunu } from "@/lib/format";
import { parseTatiller } from "@/lib/payroll";
import { vardiyaAl } from "@/lib/vardiya";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GirisCikisPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string; yer?: string; kisi?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;
  const yer = Number(q.yer) || 0;
  const tumu = q.kisi === "0";
  const kisi = Number(q.kisi) || 0;

  const [gorevYerleri, ayar, personeller] = await Promise.all([
    prisma.gorevYeri.findMany({ orderBy: { ad: "asc" } }),
    prisma.ayar.findUnique({ where: { id: 1 } }),
    prisma.personel.findMany({
      where: {
        durum: { not: "PASIF" },
        ...(yer ? { gorevYeriId: yer } : {}),
      },
      include: {
        gorevYeri: true,
        puantajlar: { where: { yil, ay }, include: { gunler: true } },
      },
      orderBy: [{ gorevYeriId: "asc" }, { adi: "asc" }],
    }),
  ]);

  const secili = tumu ? null : personeller.find((p) => p.id === kisi) ?? personeller[0];
  const idx = secili ? personeller.findIndex((p) => p.id === secili.id) : -1;
  const onceki = idx > 0 ? personeller[idx - 1] : null;
  const sonraki = idx >= 0 && idx < personeller.length - 1 ? personeller[idx + 1] : null;
  const vardiya = vardiyaAl(secili?.gorevYeri, ayar);

  const tatiller = new Set(
    parseTatiller(ayar?.resmiTatiller).filter((t) =>
      t.startsWith(`${yil}-${String(ay).padStart(2, "0")}-`),
    ),
  );
  const gunSayisi = ayGunSayisi(yil, ay);
  const mevcut = new Map((secili?.puantajlar[0]?.gunler ?? []).map((g) => [g.gun, g]));
  const gunler = secili
    ? Array.from({ length: gunSayisi }, (_, i) => {
        const gun = i + 1;
        const h = mevcut.get(gun);
        const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
        return {
          gun,
          hafta: haftaGunu(yil, ay, gun),
          tatil: tatiller.has(tarih),
          kod: h?.kod ?? "B",
          giris: h?.giris ?? "",
          cikis: h?.cikis ?? "",
        };
      })
    : [];

  const toplu = tumu
    ? personeller.flatMap((p) => {
        const map = new Map((p.puantajlar[0]?.gunler ?? []).map((g) => [g.gun, g]));
        return Array.from({ length: gunSayisi }, (_, i) => {
          const gun = i + 1;
          const h = map.get(gun);
          const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
          return {
            personelId: p.id,
            adi: `${adSoyad(p)} · ${p.gorevYeri.ad}`,
            gun,
            hafta: haftaGunu(yil, ay, gun),
            tatil: tatiller.has(tarih),
            kod: h?.kod ?? "B",
            giris: h?.giris ?? "",
            cikis: h?.cikis ?? "",
          };
        }).filter((g) => g.kod === "C" || (g.giris && g.cikis));
      })
    : [];

  const filtre = `yil=${yil}&ay=${ay}&yer=${yer}`;

  return (
    <div>
      <PageHead
        kicker="Puantaj"
        title="Giriş-çıkış"
        desc="Elle yazılır veya PDKS Excel’inden gelir. Saat = çıkış − giriş − mola. Tüm kadro görünümü şantiye için."
        actions={
          <>
            <Link className="btn btn-ghost" href={`/giris-cikis/ice-aktar?${filtre}`}>
              PDKS içe aktar
            </Link>
            <Link className="btn btn-ghost" href={`/puantaj?${filtre}`}>
              Puantaja dön
            </Link>
          </>
        }
      />

      <form className="filter-bar sheet rounded-2xl" action="/giris-cikis">
        <label className="field">
          <span>Yıl</span>
          <input name="yil" defaultValue={yil} />
        </label>
        <label className="field">
          <span>Ay</span>
          <FieldSelect
            name="ay"
            defaultValue={ay}
            options={AYLAR.map((ad, i) => ({ value: String(i + 1), label: ad }))}
          />
        </label>
        <label className="field">
          <span>Görev yeri</span>
          <FieldSelect
            name="yer"
            defaultValue={yer}
            options={[
              { value: "0", label: "Tümü" },
              ...gorevYerleri.map((g) => ({ value: String(g.id), label: g.ad })),
            ]}
          />
        </label>
        <label className="field">
          <span>Personel</span>
          <FieldSelect
            name="kisi"
            arama
            defaultValue={tumu ? "0" : String(secili?.id ?? 0)}
            options={[
              { value: "0", label: "Tüm kadro" },
              ...personeller.map((p) => ({
                value: String(p.id),
                label: `${adSoyad(p)} · ${p.gorevYeri.ad}`,
              })),
            ]}
          />
        </label>
        <button className="btn btn-ghost" type="submit">
          Getir
        </button>
      </form>

      {tumu ? (
        <GirisCikisToplu
          key={`${yil}-${ay}-${yer}`}
          yil={yil}
          ay={ay}
          molaSaat={ayar?.molaSaat ?? 1}
          satirlar={toplu}
        />
      ) : secili ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {onceki ? (
              <Link className="btn btn-ghost" href={`/giris-cikis?${filtre}&kisi=${onceki.id}`}>
                ← {adSoyad(onceki)}
              </Link>
            ) : null}
            {sonraki ? (
              <Link className="btn btn-ghost" href={`/giris-cikis?${filtre}&kisi=${sonraki.id}`}>
                {adSoyad(sonraki)} →
              </Link>
            ) : null}
          </div>
          <GirisCikisTablo
            key={`${secili.id}-${yil}-${ay}`}
            yil={yil}
            ay={ay}
            personelId={secili.id}
            adi={`${adSoyad(secili)} · ${secili.gorevYeri.ad}`}
            varsayilanGiris={vardiya.giris}
            varsayilanCikis={vardiya.cikis}
            molaSaat={vardiya.mola}
            varsayilanSaat={ayar?.varsayilanGunSaat ?? 7.5}
            normalAylikSaat={ayar?.normalAylikSaat ?? 180}
            gunler={gunler}
          />
        </>
      ) : (
        <p className="text-sm text-ink-soft/70">Bu filtrede personel yok.</p>
      )}
    </div>
  );
}

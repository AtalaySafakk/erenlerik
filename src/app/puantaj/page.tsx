import { PuantajGrid } from "@/components/puantaj-grid";
import { PageHead } from "@/components/page-head";
import { FieldSelect } from "@/components/field-select";
import { prisma } from "@/lib/prisma";
import { AYLAR } from "@/lib/format";
import { parseTatiller } from "@/lib/payroll";
import { puantajIzinleriIsle, puantajOncekiAyKopyala } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PuantajPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string; yer?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;
  const yer = Number(q.yer) || 0;

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

  const satirlar = personeller.map((p) => ({
    personelId: p.id,
    adi: p.adi,
    soyadi: p.soyadi,
    gorevi: `${p.gorevYeri.ad} · ${p.gorevi}`,
    gunler: (p.puantajlar[0]?.gunler ?? []).map((g) => ({
      gun: g.gun,
      saat: g.saat,
      giris: g.giris,
      cikis: g.cikis,
      kod: g.kod,
    })),
  }));

  return (
    <div>
      <PageHead
        kicker="Öncelik"
        title="Görev yeri puantajı"
        desc="Güne tıklayınca üstteki kalem basılır. Giriş-çıkış ayrı sayfada; saat oradan gelir. Mesai aylık 180 üzeri."
        actions={
          <>
            <Link className="btn btn-brass" href={`/giris-cikis?yil=${yil}&ay=${ay}&yer=${yer}`}>
              Giriş-çıkış
            </Link>
            <form
              action={async () => {
                "use server";
                await puantajIzinleriIsle(yil, ay, yer || undefined);
              }}
            >
              <button className="btn btn-ghost" type="submit">
                İzin/raporu işle
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await puantajOncekiAyKopyala(yil, ay, yer || undefined);
              }}
            >
              <button className="btn btn-ghost" type="submit">
                Önceki ayı kopyala
              </button>
            </form>
          </>
        }
      />

      <form className="filter-bar sheet rounded-2xl" action="/puantaj">
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
        <button className="btn btn-ghost" type="submit">
          Getir
        </button>
      </form>

      <PuantajGrid
        yil={yil}
        ay={ay}
        varsayilanSaat={ayar?.varsayilanGunSaat ?? 7.5}
        varsayilanGiris={ayar?.varsayilanGiris ?? "08:00"}
        varsayilanCikis={ayar?.varsayilanCikis ?? "16:30"}
        molaSaat={ayar?.molaSaat ?? 1}
        normalAylikSaat={ayar?.normalAylikSaat ?? 180}
        tatiller={parseTatiller(ayar?.resmiTatiller)}
        satirlar={satirlar}
      />
    </div>
  );
}

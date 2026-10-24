import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { AYLAR, adSoyad, paraTl } from "@/lib/format";
import { kasaIsaret } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function KasaPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;
  const liste = await prisma.bordro.findMany({
    where: { yil, ay },
    include: { personel: { include: { gorevYeri: true } } },
    orderBy: { id: "asc" },
  });
  const toplam = liste.reduce((t, b) => t + b.eldenOdenecek, 0);
  const odenen = liste.filter((b) => b.eldenOdendi).reduce((t, b) => t + b.eldenOdenecek, 0);

  async function isaret(formData: FormData) {
    "use server";
    await kasaIsaret(formData);
  }

  return (
    <div>
      <PageHead
        kicker="Ödeme"
        title="Elden kasa"
        desc="Ay sonu elden dağıtılacak tutarlar. Ödendi ve imza işaretlenir."
        actions={
          <Link className="btn btn-ghost" href={`/api/export/elden?yil=${yil}&ay=${ay}`}>
            Excel / imza listesi
          </Link>
        }
      />
      <form className="filter-bar sheet rounded-2xl" action="/kasa">
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
        <button className="btn btn-ghost" type="submit">
          Getir
        </button>
      </form>
      <p className="mb-4 text-sm text-ink-soft/80">
        {AYLAR[ay - 1]} toplam {paraTl(toplam)} · ödenen {paraTl(odenen)} · kalan {paraTl(toplam - odenen)}
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Görev yeri</th>
              <th>Elden</th>
              <th>Ödendi</th>
              <th>İmza</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">{adSoyad(b.personel)}</td>
                <td>{b.personel.gorevYeri.ad}</td>
                <td className="font-semibold">{paraTl(b.eldenOdenecek)}</td>
                <td>
                  <form action={isaret}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="alan" value="odendi" />
                    <button className={`chip ${b.eldenOdendi ? "chip-ok" : "chip-mute"}`} type="submit">
                      {b.eldenOdendi ? "ÖDENDİ" : "BEKLİYOR"}
                    </button>
                  </form>
                </td>
                <td>
                  <form action={isaret}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="alan" value="imza" />
                    <button className={`chip ${b.eldenImza ? "chip-ok" : "chip-mute"}`} type="submit">
                      {b.eldenImza ? "İMZA" : "İMZA YOK"}
                    </button>
                  </form>
                </td>
                <td>{b.eldenOdemeTarihi || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

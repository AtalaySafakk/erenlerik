import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { AYLAR, adSoyad, paraTl } from "@/lib/format";
import { avansKaydet, avansSil } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";

export const dynamic = "force-dynamic";

export default async function AvansPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;

  const [personeller, kayitlar] = await Promise.all([
    prisma.personel.findMany({ where: { durum: { not: "PASIF" } }, orderBy: { adi: "asc" } }),
    prisma.avans.findMany({
      where: { yil, ay },
      include: { personel: { include: { gorevYeri: true } } },
      orderBy: { id: "desc" },
    }),
  ]);
  const toplam = kayitlar.reduce((t, a) => t + a.tutar, 0);

  async function ekle(formData: FormData) {
    "use server";
    await avansKaydet(formData);
  }
  async function sil(formData: FormData) {
    "use server";
    await avansSil(Number(formData.get("id")));
  }

  return (
    <div>
      <PageHead
        kicker="Ödeme"
        title="Avans defteri"
        desc="Verilen avans elden tutardan düşülür. Bordro hesaplanınca yansır."
      />
      <form className="filter-bar sheet rounded-2xl" action="/avans">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={ekle} className="sheet rounded-2xl p-5">
          <h2 className="mb-4 font-serif text-2xl">Avans ver</h2>
          <input type="hidden" name="yil" value={yil} />
          <input type="hidden" name="ay" value={ay} />
          <div className="grid gap-3">
            <label className="field">
              <span>Personel</span>
              <FieldSelect
                name="personelId"
                required
                arama
                options={personeller.map((p) => ({ value: String(p.id), label: adSoyad(p) }))}
              />
            </label>
            <label className="field">
              <span>Tutar</span>
              <input name="tutar" required />
            </label>
            <label className="field">
              <span>Tarih</span>
              <input type="date" name="tarih" />
            </label>
            <label className="field">
              <span>Açıklama</span>
              <input name="aciklama" />
            </label>
            <button className="btn btn-primary" type="submit">
              Kaydet
            </button>
          </div>
        </form>
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm text-ink-soft/80">
            {AYLAR[ay - 1]} toplam avans {paraTl(toplam)}
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Açıklama</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {kayitlar.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold">{adSoyad(a.personel)}</td>
                    <td>{a.tarih}</td>
                    <td>{paraTl(a.tutar)}</td>
                    <td>{a.aciklama}</td>
                    <td>
                      <form action={sil}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="btn btn-ghost" type="submit">
                          Sil
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

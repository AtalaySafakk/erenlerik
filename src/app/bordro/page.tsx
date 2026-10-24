import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { AYLAR, adSoyad, paraTl } from "@/lib/format";
import { avansKaydet, bordroHesapla } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";

export const dynamic = "force-dynamic";

export default async function BordroPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;

  const [ayar, liste, personeller] = await Promise.all([
    prisma.ayar.findUnique({ where: { id: 1 } }),
    prisma.bordro.findMany({
      where: { yil, ay },
      include: { personel: { include: { gorevYeri: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.personel.findMany({
      where: { durum: { not: "PASIF" } },
      orderBy: { adi: "asc" },
    }),
  ]);

  async function hesapla() {
    "use server";
    await bordroHesapla(yil, ay);
  }

  async function avans(formData: FormData) {
    "use server";
    await avansKaydet(formData);
  }

  const bankaya = liste.reduce((t, b) => t + b.bankayaYatacak, 0);
  const elden = liste.reduce((t, b) => t + b.eldenOdenecek, 0);

  return (
    <div>
      <PageHead
        kicker="Hesap"
        title="Bordro"
        desc="Bankaya resmi maaş yatar (en az 28.075,50). 180 saat üzeri mesai resmi ücretten ×1,5 (tatilde ×2) hesaplanır ve elden ödemeye eklenir."
        actions={
          <>
            <form action={hesapla}>
              <button className="btn btn-brass" type="submit">
                Puantajdan hesapla
              </button>
            </form>
            <Link className="btn btn-ghost" href={`/api/export/banka?yil=${yil}&ay=${ay}`}>
              Banka listesi
            </Link>
            <Link className="btn btn-ghost" href={`/api/export/bordro?yil=${yil}&ay=${ay}`}>
              Excel al
            </Link>
          </>
        }
      />

      <form className="filter-bar sheet rounded-2xl" action="/bordro">
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

      <div className="sheet mb-5 rounded-2xl p-5 text-sm leading-7">
        <p>
          Resmi taban (asgari net): <strong>{paraTl(ayar?.resmiUcret ?? 28075.5)}</strong> · Normal ay:{" "}
          <strong>{ayar?.normalAylikSaat ?? 180} saat</strong>
        </p>
        <p className="text-ink-soft/80">
          Bankaya = resmi − icra − BES + banka ekleri. Elden = (net − resmi) + mesai + yemek/yol/prim −
          avans − otom. Hafta içi mesai × 1,5 · tatilde çalışma × 2. İcra bakiyesi bitince kesinti
          durur.
        </p>
        <p className="mt-2 font-semibold">
          {AYLAR[ay - 1]} toplamı · bankaya {paraTl(bankaya)} · elden {paraTl(elden)}
        </p>
      </div>

      <form action={avans} className="sheet mb-5 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <input type="hidden" name="yil" value={yil} />
        <input type="hidden" name="ay" value={ay} />
        <label className="field">
          <span>Avans personel</span>
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
        <button className="btn btn-ghost" type="submit">
          Avans yaz
        </button>
      </form>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Görev yeri</th>
              <th>Ç.gün</th>
              <th>Saat</th>
              <th>Mesai saat</th>
              <th>Tatil mesai</th>
              <th>Net maaş</th>
              <th>Resmi</th>
              <th>Ek ödeme</th>
              <th>Avans</th>
              <th>İcra</th>
              <th>BES</th>
              <th>Oran</th>
              <th>Bankaya</th>
              <th>Elden</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">{adSoyad(b.personel)}</td>
                <td>{b.personel.gorevYeri.ad}</td>
                <td>{b.calismaGun}</td>
                <td>{b.calismaSaat}</td>
                <td>{b.fazlaMesaiSaat}</td>
                <td>{b.tatilMesaiSaat}</td>
                <td>{paraTl(b.netMaas)}</td>
                <td>{paraTl(b.resmiUcret)}</td>
                <td>{paraTl(b.ekOdeme)}</td>
                <td>{paraTl(b.avans)}</td>
                <td>{paraTl(b.icraKesinti)}</td>
                <td>{paraTl(b.besKesinti)}</td>
                <td>{Math.round(b.eksikOran * 100)}%</td>
                <td className="font-semibold">{paraTl(b.bankayaYatacak)}</td>
                <td className="font-semibold">{paraTl(b.eldenOdenecek)}</td>
                <td>
                  <Link className="text-sm font-semibold text-sage underline" href={`/bordro/${b.id}`}>
                    Pusula
                  </Link>
                </td>
              </tr>
            ))}
            {liste.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-8 text-center text-ink-soft/70">
                  Bu ay henüz bordro yok. Önce puantajı doldurup hesaplayın.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

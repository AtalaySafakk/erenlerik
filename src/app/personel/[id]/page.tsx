import { notFound } from "next/navigation";
import { PersonelForm } from "@/components/personel-form";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { adSoyad, paraTl } from "@/lib/format";
import { belgeSil, belgeYukle, personelSil } from "@/lib/actions";
import { kidemIhbar } from "@/lib/kidem";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PersonelKartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personel = await prisma.personel.findUnique({
    where: { id: Number(id) },
    include: { gorevYeri: true, izinler: true, icralar: true, belgeler: { orderBy: { id: "desc" } } },
  });
  if (!personel) notFound();
  const gorevYerleri = await prisma.gorevYeri.findMany({ orderBy: { ad: "asc" } });
  const kullanilan = personel.izinler
    .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
    .reduce((t, i) => t + i.gun, 0);
  const cikis = personel.istenAyrilisTarihi ? new Date(personel.istenAyrilisTarihi) : new Date();
  const ki = kidemIhbar(personel.iseBaslamaTarihi, personel.netMaas || personel.resmiMaas, cikis);

  async function sil() {
    "use server";
    await personelSil(personel!.id);
    redirect("/personel");
  }
  async function belge(formData: FormData) {
    "use server";
    await belgeYukle(formData);
  }
  async function silBelge(formData: FormData) {
    "use server";
    await belgeSil(Number(formData.get("id")));
  }

  return (
    <div>
      <PageHead
        kicker={personel.gorevYeri.ad}
        title={adSoyad(personel)}
        desc={`Yıllık izin ${personel.yillikIzinHakki} gün · kullanılan ${kullanilan} · kalan ${personel.yillikIzinHakki - kullanilan}`}
        actions={
          <form action={sil}>
            <button className="btn btn-ghost" type="submit">
              Sil
            </button>
          </form>
        }
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="sheet rounded-2xl p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Kıdem (tahmini)</p>
          <p className="mt-2 font-serif text-3xl">{ki.yil} yıl</p>
          <p className="mt-1 text-sm text-ink-soft/75">{paraTl(ki.kidem)} · 30 gün × net</p>
        </div>
        <div className="sheet rounded-2xl p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">İhbar (tahmini)</p>
          <p className="mt-2 font-serif text-3xl">{ki.ihbarHafta} hafta</p>
          <p className="mt-1 text-sm text-ink-soft/75">{paraTl(ki.ihbar)}</p>
        </div>
        <div className="sheet rounded-2xl p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Sözleşme</p>
          <p className="mt-2 text-sm">Deneme: {personel.denemeBitis || "—"}</p>
          <p className="text-sm">Bitiş: {personel.sozlesmeBitis || "—"}</p>
        </div>
      </div>

      <PersonelForm gorevYerleri={gorevYerleri} personel={personel} />

      <section className="sheet mt-5 rounded-2xl p-5">
        <h2 className="mb-4 font-serif text-2xl">Belgeler</h2>
        <form action={belge} className="mb-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="personelId" value={personel.id} />
          <label className="field">
            <span>Tür</span>
            <select name="tip" className="select-btn">
              <option value="SOZLESME">Sözleşme</option>
              <option value="RAPOR">Rapor</option>
              <option value="ICRA">İcra</option>
              <option value="DIGER">Diğer</option>
            </select>
          </label>
          <label className="field">
            <span>Dosya</span>
            <input type="file" name="dosya" required />
          </label>
          <button className="btn btn-primary" type="submit">
            Yükle
          </button>
        </form>
        <ul className="space-y-2">
          {personel.belgeler.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm">
              <a className="font-semibold underline" href={`/api/belge/${b.id}`}>
                {b.tip} · {b.ad}
              </a>
              <form action={silBelge}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-ghost" type="submit">
                  Sil
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

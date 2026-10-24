import { PageHead } from "@/components/page-head";
import { TatilTakvimi } from "@/components/tatil-takvimi";
import { prisma } from "@/lib/prisma";
import { ayarKaydet, gorevYeriEkle, gorevYeriVardiyaKaydet } from "@/lib/actions";
import { parseTatiller } from "@/lib/payroll";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  const [ayar, yerler] = await Promise.all([
    prisma.ayar.findUnique({ where: { id: 1 } }),
    prisma.gorevYeri.findMany({ orderBy: { ad: "asc" } }),
  ]);

  async function kaydet(formData: FormData) {
    "use server";
    await ayarKaydet(formData);
  }

  async function yerEkle(formData: FormData) {
    "use server";
    await gorevYeriEkle(formData);
  }

  return (
    <div>
      <PageHead
        kicker="Kurulum"
        title="Ayarlar"
        desc="2026 net asgari 28.075,50 ₺. Hafta içi mesai ×1,5, resmi tatilde çalışma ×2."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={kaydet} className="sheet rounded-2xl p-5">
          <h2 className="mb-4 font-serif text-2xl">Bordro parametreleri</h2>
          <div className="grid gap-3">
            <label className="field">
              <span>Firma adı</span>
              <input name="firmaAdi" defaultValue={ayar?.firmaAdi ?? ""} />
            </label>
            <label className="field">
              <span>Asgari net / resmi taban (en az 28.075,50)</span>
              <input name="resmiUcret" defaultValue={ayar?.resmiUcret ?? 28075.5} />
            </label>
            <label className="field">
              <span>Normal aylık saat</span>
              <input name="normalAylikSaat" defaultValue={ayar?.normalAylikSaat ?? 180} />
            </label>
            <label className="field">
              <span>Tam ay gün (26)</span>
              <input name="tamAyGun" defaultValue={ayar?.tamAyGun ?? 26} />
            </label>
            <label className="field">
              <span>Mesai çarpanı (hafta içi, %50 = 1,5)</span>
              <input name="mesaiCarpan" defaultValue={ayar?.mesaiCarpan ?? 1.5} />
            </label>
            <label className="field">
              <span>Tatil mesai çarpanı (%100 = 2)</span>
              <input name="mesaiCarpanTatil" defaultValue={ayar?.mesaiCarpanTatil ?? 2} />
            </label>
            <label className="field">
              <span>Varsayılan gün saati</span>
              <input name="varsayilanGunSaat" defaultValue={ayar?.varsayilanGunSaat ?? 7.5} />
            </label>
            <label className="field">
              <span>Varsayılan giriş</span>
              <input type="time" name="varsayilanGiris" defaultValue={ayar?.varsayilanGiris ?? "08:00"} />
            </label>
            <label className="field">
              <span>Varsayılan çıkış</span>
              <input type="time" name="varsayilanCikis" defaultValue={ayar?.varsayilanCikis ?? "16:30"} />
            </label>
            <label className="field">
              <span>Mola (saat)</span>
              <input name="molaSaat" defaultValue={ayar?.molaSaat ?? 1} />
            </label>
            <button className="btn btn-primary" type="submit">
              Kaydet
            </button>
          </div>
        </form>

        <div className="sheet rounded-2xl p-5">
          <h2 className="mb-4 font-serif text-2xl">Görev yerleri</h2>
          <ul className="mb-4 space-y-3">
            {yerler.map((y) => (
              <li key={y.id} className="rounded-xl bg-paper p-3">
                <p className="mb-2 font-semibold">{y.ad}</p>
                <form action={gorevYeriVardiyaKaydet} className="grid grid-cols-3 gap-2">
                  <input type="hidden" name="id" value={y.id} />
                  <label className="field">
                    <span>Giriş</span>
                    <input type="time" name="varsayilanGiris" defaultValue={y.varsayilanGiris || "08:00"} />
                  </label>
                  <label className="field">
                    <span>Çıkış</span>
                    <input type="time" name="varsayilanCikis" defaultValue={y.varsayilanCikis || "16:30"} />
                  </label>
                  <label className="field">
                    <span>Mola</span>
                    <input name="molaSaat" defaultValue={y.molaSaat || 1} />
                  </label>
                  <button className="btn btn-ghost col-span-3" type="submit">
                    Vardiyayı kaydet
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={yerEkle} className="flex gap-2">
            <label className="field flex-1">
              <span>Yeni yer</span>
              <input name="ad" placeholder="SAHA, OFİS…" />
            </label>
            <button className="btn btn-ghost self-end" type="submit">
              Ekle
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <TatilTakvimi baslangic={parseTatiller(ayar?.resmiTatiller)} />
      </div>
    </div>
  );
}

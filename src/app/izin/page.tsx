import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { adSoyad } from "@/lib/format";
import { parseTatiller } from "@/lib/payroll";
import { izinKaydet, izinSil } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";
import { IzinTarihAlanlari } from "@/components/izin-tarih";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IzinPage() {
  const [ayar, personeller, hareket] = await Promise.all([
    prisma.ayar.findUnique({ where: { id: 1 } }),
    prisma.personel.findMany({
      include: { gorevYeri: true, izinler: true },
      orderBy: { adi: "asc" },
    }),
    prisma.izin.findMany({
      where: { tip: "YILLIK" },
      include: { personel: true },
      orderBy: { id: "desc" },
    }),
  ]);
  const tatiller = parseTatiller(ayar?.resmiTatiller);

  async function ekle(formData: FormData) {
    "use server";
    await izinKaydet(formData);
  }

  async function sil(formData: FormData) {
    "use server";
    await izinSil(Number(formData.get("id")));
  }

  return (
    <div>
      <PageHead
        kicker="Takip"
        title="Yıllık izin"
        desc="Hak, kullanılan ve kalan. Hafta sonu ile resmi tatil gün hakkından düşülmez ve puantaja yazılmaz."
        actions={
          <Link className="btn btn-ghost" href="/api/export/izin">
            Excel al
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <form action={ekle} className="sheet rounded-2xl p-5 lg:col-span-1">
          <h2 className="mb-4 font-serif text-2xl">İzin işle</h2>
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
            <input type="hidden" name="tip" value="YILLIK" />
            <IzinTarihAlanlari sadeceIsGunleri tatiller={tatiller} />
            <label className="field">
              <span>Açıklama</span>
              <input name="aciklama" />
            </label>
            <button className="btn btn-primary" type="submit">
              Kaydet
            </button>
          </div>
        </form>

        <div className="table-wrap lg:col-span-2">
          <table className="data">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Görev yeri</th>
                <th>Hak</th>
                <th>Kullanılan</th>
                <th>Kalan</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {personeller.map((p) => {
                const kullanilan = p.izinler
                  .filter((i) => i.tip === "YILLIK" && i.durum === "ONAYLANDI")
                  .reduce((t, i) => t + i.gun, 0);
                const kalan = p.yillikIzinHakki - kullanilan;
                return (
                  <tr key={p.id}>
                    <td className="font-semibold">{adSoyad(p)}</td>
                    <td>{p.gorevYeri.ad}</td>
                    <td>{p.yillikIzinHakki}</td>
                    <td>{kullanilan}</td>
                    <td>{kalan}</td>
                    <td>
                      <span className={`chip ${kalan > 0 ? "chip-ok" : "chip-mute"}`}>
                        {kalan > 0 ? "VAR" : "YOK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-3 font-serif text-2xl">Hareketler</h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Gün</th>
              <th>Açıklama</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hareket.map((i) => (
              <tr key={i.id}>
                <td>{adSoyad(i.personel)}</td>
                <td>{i.baslangic}</td>
                <td>{i.bitis}</td>
                <td>{i.gun}</td>
                <td>{i.aciklama}</td>
                <td>
                  <form action={sil}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="text-sm font-semibold text-rose-800" type="submit">
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
  );
}

import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { adSoyad } from "@/lib/format";
import { izinKaydet, izinSil } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";
import { IzinTarihAlanlari } from "@/components/izin-tarih";

export const dynamic = "force-dynamic";

export default async function MazeretPage() {
  const [personeller, kayitlar] = await Promise.all([
    prisma.personel.findMany({ orderBy: { adi: "asc" } }),
    prisma.izin.findMany({
      where: { tip: { in: ["MAZERET", "RAPOR"] } },
      include: { personel: { include: { gorevYeri: true } } },
      orderBy: { id: "desc" },
    }),
  ]);

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
        title="Mazeret / Rapor"
        desc="Mazeret izni ve istirahat raporu. Puantajda M ve R kodlarıyla da işaretlenebilir."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <form action={ekle} className="sheet rounded-2xl p-5">
          <h2 className="mb-4 font-serif text-2xl">Kayıt ekle</h2>
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
              <span>Tip</span>
              <FieldSelect
                name="tip"
                defaultValue="MAZERET"
                options={[
                  { value: "MAZERET", label: "Mazeret izni" },
                  { value: "RAPOR", label: "Rapor" },
                ]}
              />
            </label>
            <IzinTarihAlanlari />
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
                <th>Tip</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Gün</th>
                <th>Açıklama</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold">{adSoyad(i.personel)}</td>
                  <td>
                    <span className={`chip ${i.tip === "RAPOR" ? "chip-bad" : "chip-warn"}`}>
                      {i.tip}
                    </span>
                  </td>
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
    </div>
  );
}

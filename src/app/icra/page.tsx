import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/prisma";
import { adSoyad, paraTl } from "@/lib/format";
import { icraDurumDegistir, icraKaydet } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";
import { IcraKesintiAlanlari } from "@/components/icra-kesinti";
import { icraKesintiTutari } from "@/lib/payroll";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IcraPage() {
  const [personeller, kayitlar] = await Promise.all([
    prisma.personel.findMany({ orderBy: { adi: "asc" } }),
    prisma.icra.findMany({
      include: { personel: { include: { gorevYeri: true } } },
      orderBy: { id: "desc" },
    }),
  ]);

  async function ekle(formData: FormData) {
    "use server";
    await icraKaydet(formData);
  }

  async function durum(formData: FormData) {
    "use server";
    await icraDurumDegistir(Number(formData.get("id")), formData.get("aktif") !== "1");
  }

  return (
    <div>
      <PageHead
        kicker="Takip"
        title="İcra"
        desc="Kesinti tutar veya net maaş yüzdesi. Bordro hesaplanınca bakiyeden düşer; kalan bitince durur."
        actions={
          <Link className="btn btn-ghost" href="/api/export/icra">
            Excel al
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <form action={ekle} className="sheet rounded-2xl p-5">
          <h2 className="mb-4 font-serif text-2xl">Yeni icra</h2>
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
              <span>Dosya no</span>
              <input name="dosyaNo" />
            </label>
            <label className="field">
              <span>Alacaklı</span>
              <input name="alacakli" />
            </label>
            <label className="field">
              <span>Toplam tutar</span>
              <input name="tutar" />
            </label>
            <IcraKesintiAlanlari />
            <label className="field">
              <span>Ödenen</span>
              <input name="odenen" defaultValue={0} />
            </label>
            <label className="field">
              <span>Başlangıç</span>
              <input type="date" name="baslangic" />
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
                <th>Dosya</th>
                <th>Alacaklı</th>
                <th>Tutar</th>
                <th>Aylık kesinti</th>
                <th>Ödenen</th>
                <th>Kalan</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold">{adSoyad(i.personel)}</td>
                  <td>{i.dosyaNo}</td>
                  <td>{i.alacakli}</td>
                  <td>{paraTl(i.tutar)}</td>
                  <td>
                    {i.kesintiTip === "YUZDE" ? (
                      <>
                        %{Number(i.kesintiYuzde).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                        <div className="text-xs text-ink-soft/70">
                          {paraTl(icraKesintiTutari(i, i.personel.netMaas))}
                        </div>
                      </>
                    ) : (
                      paraTl(i.kesinti)
                    )}
                  </td>
                  <td>{paraTl(i.odenen)}</td>
                  <td className="font-semibold">{paraTl(i.tutar - i.odenen)}</td>
                  <td>
                    <form action={durum}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="aktif" value={i.aktif ? "1" : "0"} />
                      <button className={`chip ${i.aktif ? "chip-bad" : "chip-mute"}`} type="submit">
                        {i.aktif ? "AKTİF" : "KAPALI"}
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

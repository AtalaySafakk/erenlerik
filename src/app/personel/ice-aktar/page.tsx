import { PageHead } from "@/components/page-head";
import { personelExcelYukle } from "@/lib/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function IceAktarPage() {
  async function yukle(formData: FormData) {
    "use server";
    const sonuc = await personelExcelYukle(formData);
    if (sonuc.ok) redirect("/personel");
  }

  return (
    <div>
      <PageHead
        kicker="Kadro"
        title="Excel içe aktar"
        desc="Onların attığı personel tablosunu olduğu gibi yükleyin. TC varsa günceller, yoksa yeni kart açar. Görev yeri yoksa otomatik eklenir."
      />
      <form action={yukle} className="sheet max-w-xl rounded-2xl p-6">
        <label className="field">
          <span>XLSX dosyası</span>
          <input type="file" name="dosya" accept=".xlsx,.xls" required />
        </label>
        <p className="mt-3 text-sm leading-6 text-ink-soft/80">
          Kolonlar: ADI, SOYADI, GÖREVYERİ, CİNSİYET, GÖREVİ, TCKİMLİKNO, İCRA DURUM, HESAPNO,
          NET MAAŞ, BESDURUM, ADRES, GSM…
        </p>
        <button className="btn btn-primary mt-5" type="submit">
          Aktar
        </button>
      </form>
    </div>
  );
}

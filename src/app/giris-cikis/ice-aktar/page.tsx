import { PageHead } from "@/components/page-head";
import { pdksYukle } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PdksAktarPage() {
  async function yukle(formData: FormData) {
    "use server";
    const sonuc = await pdksYukle(formData);
    if (sonuc.ok) redirect(`/giris-cikis?ok=${sonuc.islenen ?? 0}`);
  }

  return (
    <div>
      <PageHead
        kicker="PDKS"
        title="Turnike / Excel içe aktar"
        desc="Sütunlar: TC (veya ADI + SOYADI), TARİH, GİRİŞ, ÇIKIŞ. Kayıtlar puantaja PDKS kaynağıyla yazılır."
        actions={
          <Link className="btn btn-ghost" href="/giris-cikis">
            Geri
          </Link>
        }
      />
      <form action={yukle} className="sheet max-w-lg rounded-2xl p-5">
        <label className="field">
          <span>Excel dosyası</span>
          <input type="file" name="dosya" accept=".xlsx,.xls" required />
        </label>
        <button className="btn btn-primary mt-4" type="submit">
          Aktar
        </button>
      </form>
    </div>
  );
}

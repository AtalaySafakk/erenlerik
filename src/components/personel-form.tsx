import { personelKaydet } from "@/lib/actions";
import { FieldSelect } from "@/components/field-select";
import { ASGARI_NET, kdemIzinHakki } from "@/lib/payroll";
import { para } from "@/lib/format";
import { redirect } from "next/navigation";

type GorevYeri = { id: number; ad: string };
type Personel = {
  id?: number;
  adi: string;
  soyadi: string;
  gorevYeriId: number;
  cinsiyet: string;
  gorevi: string;
  tcKimlik: string;
  icraDurum: string;
  hesapNo: string;
  iseBaslamaTarihi: string;
  dogumTarihi: string;
  netMaas: number;
  resmiMaas?: number;
  ekOdeme: number;
  yemek?: number;
  yol?: number;
  prim?: number;
  yemekHedef?: string;
  yolHedef?: string;
  primHedef?: string;
  denemeBitis?: string;
  sozlesmeBitis?: string;
  besDurum: string;
  besKesinti: number;
  otomKatilimBedeli: number;
  durum: string;
  istenAyrilisTarihi: string;
  yillikIzinHakki: number;
  adres: string;
  sskIsyeriNo: string;
  gsm: string;
  medeniDurum: string;
  cocukSayisi: number;
};

export function PersonelForm({
  gorevYerleri,
  personel,
}: {
  gorevYerleri: GorevYeri[];
  personel?: Personel;
}) {
  async function kaydet(formData: FormData) {
    "use server";
    const sonuc = await personelKaydet(formData);
    if (sonuc.ok) redirect("/personel");
  }

  return (
    <form action={kaydet} className="sheet rounded-2xl p-6">
      {personel?.id ? <input type="hidden" name="id" value={personel.id} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field">
          <span>Adı</span>
          <input name="adi" defaultValue={personel?.adi} required />
        </label>
        <label className="field">
          <span>Soyadı</span>
          <input name="soyadi" defaultValue={personel?.soyadi} required />
        </label>
        <label className="field">
          <span>Görev yeri</span>
          <FieldSelect
            name="gorevYeriId"
            required
            defaultValue={personel?.gorevYeriId}
            options={gorevYerleri.map((g) => ({ value: String(g.id), label: g.ad }))}
          />
        </label>
        <label className="field">
          <span>Cinsiyet</span>
          <FieldSelect
            name="cinsiyet"
            defaultValue={personel?.cinsiyet ?? "BAY"}
            options={[
              { value: "BAY", label: "Bay" },
              { value: "BAYAN", label: "Bayan" },
            ]}
          />
        </label>
        <label className="field">
          <span>Görevi</span>
          <input name="gorevi" defaultValue={personel?.gorevi} />
        </label>
        <label className="field">
          <span>TC kimlik no</span>
          <input name="tcKimlik" defaultValue={personel?.tcKimlik} />
        </label>
        <label className="field">
          <span>İcra durum</span>
          <FieldSelect
            name="icraDurum"
            defaultValue={personel?.icraDurum ?? "ICRAYOK"}
            options={[
              { value: "ICRAYOK", label: "İcra yok" },
              { value: "ICRAVAR", label: "İcra var" },
            ]}
          />
        </label>
        <label className="field">
          <span>Hesap no</span>
          <input name="hesapNo" defaultValue={personel?.hesapNo} />
        </label>
        <label className="field">
          <span>İşe başlama tarihi</span>
          <input type="date" name="iseBaslamaTarihi" defaultValue={personel?.iseBaslamaTarihi} />
        </label>
        <label className="field">
          <span>D. tarihi</span>
          <input type="date" name="dogumTarihi" defaultValue={personel?.dogumTarihi} />
        </label>
        <label className="field">
          <span>Net maaş (bizdeki)</span>
          <input name="netMaas" defaultValue={personel?.netMaas ?? 0} />
        </label>
        <label className="field">
          <span>Resmi maaş (en az {para(ASGARI_NET)})</span>
          <input
            name="resmiMaas"
            min={ASGARI_NET}
            defaultValue={personel?.resmiMaas ?? ASGARI_NET}
          />
        </label>
        <label className="field">
          <span>Ek ödeme (aylık)</span>
          <input name="ekOdeme" defaultValue={personel?.ekOdeme ?? 0} />
        </label>
        <label className="field">
          <span>Yemek</span>
          <input name="yemek" defaultValue={personel?.yemek ?? 0} />
        </label>
        <label className="field">
          <span>Yemek hedef</span>
          <FieldSelect
            name="yemekHedef"
            defaultValue={personel?.yemekHedef ?? "ELDEN"}
            options={[
              { value: "ELDEN", label: "Elden" },
              { value: "BANKA", label: "Banka" },
            ]}
          />
        </label>
        <label className="field">
          <span>Yol</span>
          <input name="yol" defaultValue={personel?.yol ?? 0} />
        </label>
        <label className="field">
          <span>Yol hedef</span>
          <FieldSelect
            name="yolHedef"
            defaultValue={personel?.yolHedef ?? "ELDEN"}
            options={[
              { value: "ELDEN", label: "Elden" },
              { value: "BANKA", label: "Banka" },
            ]}
          />
        </label>
        <label className="field">
          <span>Prim</span>
          <input name="prim" defaultValue={personel?.prim ?? 0} />
        </label>
        <label className="field">
          <span>Prim hedef</span>
          <FieldSelect
            name="primHedef"
            defaultValue={personel?.primHedef ?? "ELDEN"}
            options={[
              { value: "ELDEN", label: "Elden" },
              { value: "BANKA", label: "Banka" },
            ]}
          />
        </label>
        <label className="field">
          <span>Deneme süresi bitiş</span>
          <input type="date" name="denemeBitis" defaultValue={personel?.denemeBitis} />
        </label>
        <label className="field">
          <span>Sözleşme bitiş</span>
          <input type="date" name="sozlesmeBitis" defaultValue={personel?.sozlesmeBitis} />
        </label>
        <label className="field">
          <span>BES durum</span>
          <FieldSelect
            name="besDurum"
            defaultValue={personel?.besDurum ?? "YOK"}
            options={[
              { value: "YOK", label: "Yok" },
              { value: "VAR", label: "Var" },
            ]}
          />
        </label>
        <label className="field">
          <span>BES kesinti</span>
          <input name="besKesinti" defaultValue={personel?.besKesinti ?? 0} />
        </label>
        <label className="field">
          <span>Otom. katılım bedeli</span>
          <input name="otomKatilimBedeli" defaultValue={personel?.otomKatilimBedeli ?? 0} />
        </label>
        <label className="field">
          <span>Durumu</span>
          <FieldSelect
            name="durum"
            defaultValue={personel?.durum ?? "AKTIF"}
            options={[
              { value: "AKTIF", label: "Aktif" },
              { value: "PASIF", label: "Pasif" },
            ]}
          />
        </label>
        <label className="field">
          <span>İşten ayrılış tarihi</span>
          <input type="date" name="istenAyrilisTarihi" defaultValue={personel?.istenAyrilisTarihi} />
        </label>
        <label className="field">
          <span>
            Yıllık izin hk
            {personel?.iseBaslamaTarihi
              ? ` · kıdem önerisi ${kdemIzinHakki(personel.iseBaslamaTarihi)}`
              : ""}
          </span>
          <input
            name="yillikIzinHakki"
            defaultValue={personel?.yillikIzinHakki ?? 14}
          />
        </label>
        <label className="field">
          <span>GSM tlf</span>
          <input name="gsm" defaultValue={personel?.gsm} />
        </label>
        <label className="field">
          <span>Medeni durum</span>
          <input name="medeniDurum" defaultValue={personel?.medeniDurum} />
        </label>
        <label className="field">
          <span>Çocuk sayısı</span>
          <input name="cocukSayisi" defaultValue={personel?.cocukSayisi ?? 0} />
        </label>
        <label className="field">
          <span>SSK işyeri no</span>
          <input name="sskIsyeriNo" defaultValue={personel?.sskIsyeriNo} />
        </label>
        <label className="field md:col-span-3">
          <span>Adres</span>
          <textarea name="adres" rows={2} defaultValue={personel?.adres} />
        </label>
      </div>
      <div className="mt-6 flex gap-2">
        <button className="btn btn-primary" type="submit">
          Kaydet
        </button>
      </div>
    </form>
  );
}

import { PageHead } from "@/components/page-head";
import { FieldSelect } from "@/components/field-select";
import { AYLAR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; ay?: string }>;
}) {
  const q = await searchParams;
  const simdi = new Date();
  const yil = Number(q.yil) || simdi.getFullYear();
  const ay = Number(q.ay) || simdi.getMonth() + 1;

  const kartlar = [
    {
      baslik: "Personel listesi",
      desc: "Excel’deki tüm kolonlar: ad, görev yeri, maaş, izin, icra, adres, SSK.",
      href: "/api/export/personel",
    },
    {
      baslik: `${AYLAR[ay - 1]} puantaj`,
      desc: "Gün gün çalışma, ç.gün, saat ve fazla mesai.",
      href: `/api/export/puantaj?yil=${yil}&ay=${ay}`,
    },
    {
      baslik: `${AYLAR[ay - 1]} bordro`,
      desc: "Net maaş, resmi bodro, ek ödeme, avans, bankaya ve elden.",
      href: `/api/export/bordro?yil=${yil}&ay=${ay}`,
    },
    {
      baslik: "Yıllık izin",
      desc: "Hak / kullanılan / kalan özet ve hareket listesi.",
      href: "/api/export/izin",
    },
    {
      baslik: "İcra takibi",
      desc: "Dosya, alacaklı, tutar, ödenen ve kalan.",
      href: "/api/export/icra",
    },
    {
      baslik: `${AYLAR[ay - 1]} banka listesi`,
      desc: "Ad, hesap no, bankaya yatacak. Bankaya verilecek döküm.",
      href: `/api/export/banka?yil=${yil}&ay=${ay}`,
    },
    {
      baslik: `${AYLAR[ay - 1]} elden kasa`,
      desc: "İmza listesi: elden tutar, ödendi, imza.",
      href: `/api/export/elden?yil=${yil}&ay=${ay}`,
    },
    {
      baslik: `${AYLAR[ay - 1]} SGK dökümü`,
      desc: "TC, SSK işyeri, işe giriş/çıkış, gün ve saat. e-bildirge hazırlık.",
      href: `/api/export/sgk?yil=${yil}&ay=${ay}`,
    },
    {
      baslik: `${AYLAR[ay - 1]} master Excel`,
      desc: "Onların attığı tablo formatı: personel + ç.gün + bankaya + elden.",
      href: `/api/export/master?yil=${yil}&ay=${ay}`,
    },
  ];

  return (
    <div>
      <PageHead
        kicker="Çıktı"
        title="Excel raporlar"
        desc="Her takip ekranı Excel’e dökülebilir. Dönem seçip ilgili raporu alın."
      />

      <form className="filter-bar sheet rounded-2xl" action="/raporlar">
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
          Dönemi uygula
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {kartlar.map((k) => (
          <a key={k.href} href={k.href} className="sheet block rounded-2xl p-5 hover:border-brass">
            <h2 className="font-serif text-2xl">{k.baslik}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft/80">{k.desc}</p>
            <p className="mt-4 text-sm font-bold tracking-wide text-brass">XLSX indir →</p>
          </a>
        ))}
      </div>
    </div>
  );
}

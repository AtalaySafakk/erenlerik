"use client";

import { useMemo, useState, useTransition } from "react";
import { girisCikisKaydet } from "@/lib/actions";
import { AYLAR, GUN_KISA } from "@/lib/format";
import { PUANTAJ_KODLARI, type PuantajKod } from "@/lib/payroll";
import { calismaSaati, saatEtiket } from "@/lib/saat";

export type GirisCikisGun = {
  gun: number;
  hafta: number;
  tatil: boolean;
  kod: string;
  giris: string;
  cikis: string;
};

export function GirisCikisTablo({
  yil,
  ay,
  personelId,
  adi,
  varsayilanGiris,
  varsayilanCikis,
  molaSaat,
  varsayilanSaat,
  normalAylikSaat,
  gunler: ilk,
}: {
  yil: number;
  ay: number;
  personelId: number;
  adi: string;
  varsayilanGiris: string;
  varsayilanCikis: string;
  molaSaat: number;
  varsayilanSaat: number;
  normalAylikSaat: number;
  gunler: GirisCikisGun[];
}) {
  const [gunler, setGunler] = useState(ilk);
  const [mesaj, setMesaj] = useState("");
  const [pending, start] = useTransition();

  function yaz(gun: number, alan: "giris" | "cikis", deger: string) {
    setGunler((onceki) =>
      onceki.map((g) => (g.gun === gun ? { ...g, [alan]: deger } : g)),
    );
  }

  function kilitli(g: GirisCikisGun) {
    return g.kod !== "C" && g.kod !== "B" && g.kod !== "";
  }

  function doldur() {
    setGunler((onceki) =>
      onceki.map((g) => {
        if (kilitli(g)) return g;
        if (g.hafta === 0 || g.hafta === 6 || g.tatil) return g;
        return {
          ...g,
          kod: "C",
          giris: g.giris || varsayilanGiris,
          cikis: g.cikis || varsayilanCikis,
        };
      }),
    );
  }

  const ozet = useMemo(() => {
    const calisan = gunler.filter((g) => g.giris && g.cikis && !kilitli(g));
    const saat = calisan.reduce((t, g) => t + calismaSaati(g.giris, g.cikis, molaSaat), 0);
    return { gun: calisan.length, saat, mesai: Math.max(0, saat - normalAylikSaat) };
  }, [gunler, molaSaat, normalAylikSaat]);

  function kaydet() {
    start(async () => {
      await girisCikisKaydet({
        yil,
        ay,
        personelId,
        gunler: gunler.map((g) => ({ gun: g.gun, giris: g.giris, cikis: g.cikis })),
      });
      setMesaj("Giriş-çıkış kaydedildi.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="sheet flex flex-wrap items-end justify-between gap-3 rounded-2xl p-4">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Personel</p>
          <p className="font-serif text-2xl">{adi}</p>
          <p className="mt-1 text-sm text-ink-soft/75">
            {ozet.gun} gün · {saatEtiket(ozet.saat)} saat · mesai {saatEtiket(ozet.mesai)} · mola{" "}
            {saatEtiket(molaSaat)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={doldur}>
            Hafta içine varsayılan saat
          </button>
          <button type="button" className="btn btn-brass" onClick={kaydet} disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
      {mesaj ? <p className="text-sm text-sage">{mesaj}</p> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Gün</th>
              <th>Durum</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Saat</th>
              <th>Günlük fazla</th>
            </tr>
          </thead>
          <tbody>
            {gunler.map((g) => {
              const kilit = kilitli(g);
              const saat = g.giris && g.cikis ? calismaSaati(g.giris, g.cikis, molaSaat) : 0;
              const fazla = Math.max(0, saat - varsayilanSaat);
              const ozel = g.hafta === 0 || g.tatil;
              return (
                <tr key={g.gun} className={ozel ? "bg-[#f6eee2]/60" : undefined}>
                  <td className="font-semibold">
                    {g.gun} {AYLAR[ay - 1]}
                    <div className="text-xs font-normal text-ink-soft/70">{GUN_KISA[g.hafta]}</div>
                  </td>
                  <td>
                    {g.kod && g.kod !== "B" && g.kod !== "C" ? (
                      PUANTAJ_KODLARI[g.kod as PuantajKod]?.ad ?? g.kod
                    ) : g.giris && g.cikis ? (
                      "Çalıştı"
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {kilit ? (
                      "—"
                    ) : (
                      <input
                        type="time"
                        className="saat-input"
                        value={g.giris}
                        onChange={(e) => yaz(g.gun, "giris", e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    {kilit ? (
                      "—"
                    ) : (
                      <input
                        type="time"
                        className="saat-input"
                        value={g.cikis}
                        onChange={(e) => yaz(g.gun, "cikis", e.target.value)}
                      />
                    )}
                  </td>
                  <td>{saat ? saatEtiket(saat) : "—"}</td>
                  <td className={fazla > 0 ? "font-semibold text-brass" : ""}>
                    {fazla > 0 ? saatEtiket(fazla) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

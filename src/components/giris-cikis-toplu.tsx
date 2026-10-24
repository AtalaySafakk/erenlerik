"use client";

import { useMemo, useState, useTransition } from "react";
import { girisCikisTopluKaydet } from "@/lib/actions";
import { SearchBar } from "@/components/field-select";
import { AYLAR, GUN_KISA } from "@/lib/format";
import { calismaSaati, saatEtiket } from "@/lib/saat";

export type TopluSatir = {
  personelId: number;
  adi: string;
  gun: number;
  hafta: number;
  tatil: boolean;
  kod: string;
  giris: string;
  cikis: string;
};

export function GirisCikisToplu({
  yil,
  ay,
  molaSaat,
  satirlar: ilk,
}: {
  yil: number;
  ay: number;
  molaSaat: number;
  satirlar: TopluSatir[];
}) {
  const [satirlar, setSatirlar] = useState(ilk);
  const [q, setQ] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [pending, start] = useTransition();

  const gorunen = useMemo(() => {
    const s = q.toLocaleLowerCase("tr");
    if (!s) return satirlar;
    return satirlar.filter((r) => r.adi.toLocaleLowerCase("tr").includes(s));
  }, [q, satirlar]);

  function yaz(i: number, alan: "giris" | "cikis", deger: string) {
    setSatirlar((o) => o.map((r, idx) => (idx === i ? { ...r, [alan]: deger } : r)));
  }

  const eksik = satirlar.filter((r) => r.kod === "C" && (!r.giris || !r.cikis)).length;

  function kaydet() {
    start(async () => {
      await girisCikisTopluKaydet({
        yil,
        ay,
        satirlar: satirlar.map((r) => ({
          personelId: r.personelId,
          gun: r.gun,
          giris: r.giris,
          cikis: r.cikis,
        })),
      });
      setMesaj("Toplu giriş-çıkış kaydedildi.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="filter-bar sheet rounded-2xl !mb-0">
        <SearchBar value={q} onChange={setQ} placeholder="Personel ara…" />
        <p className="pb-1 text-sm text-ink-soft/70">
          {gorunen.length} satır
          {eksik ? ` · ${eksik} eksik giriş/çıkış` : ""}
        </p>
        <button type="button" className="btn btn-brass" onClick={kaydet} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Tümünü kaydet"}
        </button>
      </div>
      {mesaj ? <p className="text-sm text-sage">{mesaj}</p> : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Gün</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Saat</th>
              <th>Uyarı</th>
            </tr>
          </thead>
          <tbody>
            {gorunen.map((r) => {
              const i = satirlar.indexOf(r);
              const kilit = r.kod !== "C" && r.kod !== "B" && r.kod !== "";
              const saat = r.giris && r.cikis ? calismaSaati(r.giris, r.cikis, molaSaat) : 0;
              const uyari = r.kod === "C" && (!r.giris || !r.cikis);
              return (
                <tr key={`${r.personelId}-${r.gun}`} className={uyari ? "bg-[#f6e1dc]/50" : undefined}>
                  <td className="font-semibold">{r.adi}</td>
                  <td>
                    {r.gun} {AYLAR[ay - 1]}
                    <div className="text-xs text-ink-soft/70">{GUN_KISA[r.hafta]}</div>
                  </td>
                  <td>
                    {kilit ? (
                      "—"
                    ) : (
                      <input
                        type="time"
                        className="saat-input"
                        value={r.giris}
                        onChange={(e) => yaz(i, "giris", e.target.value)}
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
                        value={r.cikis}
                        onChange={(e) => yaz(i, "cikis", e.target.value)}
                      />
                    )}
                  </td>
                  <td>{saat ? saatEtiket(saat) : "—"}</td>
                  <td>{uyari ? "Eksik saat" : r.tatil && r.kod === "C" ? "Tatil mesai" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

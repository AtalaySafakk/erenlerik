"use client";

import { useMemo, useState, useTransition } from "react";
import { puantajKaydet } from "@/lib/actions";
import { SearchBar } from "@/components/field-select";
import { AYLAR, GUN_KISA, haftaGunu } from "@/lib/format";
import { PUANTAJ_KODLARI, type PuantajKod } from "@/lib/payroll";
import { calismaSaati, gunSaati, saatEtiket } from "@/lib/saat";

type Hucre = { gun: number; saat: number; kod: string; giris?: string; cikis?: string };
type Satir = {
  personelId: number;
  adi: string;
  soyadi: string;
  gorevi: string;
  gunler: Hucre[];
};

const MODLAR: { kod: PuantajKod; etiket: string }[] = [
  { kod: "C", etiket: "Çalıştı" },
  { kod: "I", etiket: "Yıllık izin" },
  { kod: "R", etiket: "Rapor" },
  { kod: "M", etiket: "Mazeret" },
  { kod: "H", etiket: "Hafta tatili" },
  { kod: "T", etiket: "Resmi tatil" },
  { kod: "B", etiket: "Sil" },
];

function hucreBul(satir: Satir, gun: number): Hucre {
  return satir.gunler.find((g) => g.gun === gun) ?? { gun, saat: 0, kod: "B", giris: "", cikis: "" };
}

export function PuantajGrid({
  yil,
  ay,
  varsayilanSaat,
  varsayilanGiris,
  varsayilanCikis,
  molaSaat,
  normalAylikSaat,
  tatiller,
  satirlar: ilk,
}: {
  yil: number;
  ay: number;
  varsayilanSaat: number;
  varsayilanGiris: string;
  varsayilanCikis: string;
  molaSaat: number;
  normalAylikSaat: number;
  tatiller: string[];
  satirlar: Satir[];
}) {
  const gunSayisi = new Date(yil, ay, 0).getDate();
  const [mod, setMod] = useState<PuantajKod>("C");
  const [satirlar, setSatirlar] = useState(ilk);
  const [arama, setArama] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [pending, start] = useTransition();
  const tatilGunleri = new Set(
    tatiller
      .filter((t) => t.startsWith(`${yil}-${String(ay).padStart(2, "0")}-`))
      .map((t) => Number(t.slice(-2))),
  );

  const calistiSaat = calismaSaati(varsayilanGiris, varsayilanCikis, molaSaat) || varsayilanSaat;

  function yazHucre(personelId: number, gun: number, veri: Omit<Hucre, "gun">) {
    setSatirlar((onceki) =>
      onceki.map((s) => {
        if (s.personelId !== personelId) return s;
        const diger = s.gunler.filter((g) => g.gun !== gun);
        if (veri.kod === "B") return { ...s, gunler: diger };
        return { ...s, gunler: [...diger, { gun, ...veri }] };
      }),
    );
  }

  function calistiHucre(giris = varsayilanGiris, cikis = varsayilanCikis): Omit<Hucre, "gun"> {
    return {
      kod: "C",
      giris,
      cikis,
      saat: calismaSaati(giris, cikis, molaSaat) || calistiSaat,
    };
  }

  function uygula(personelId: number, gun: number) {
    if (mod === "C") {
      const satir = satirlar.find((s) => s.personelId === personelId);
      const mevcut = satir ? hucreBul(satir, gun) : null;
      if (mevcut?.kod !== "C") yazHucre(personelId, gun, calistiHucre());
      return;
    }
    yazHucre(personelId, gun, { kod: mod, saat: 0, giris: "", cikis: "" });
  }

  function toplu(fn: (s: Satir, gun: number) => Omit<Hucre, "gun"> | null) {
    setSatirlar((onceki) =>
      onceki.map((s) => {
        const map = new Map(s.gunler.map((g) => [g.gun, g]));
        for (let gun = 1; gun <= gunSayisi; gun++) {
          const son = fn(s, gun);
          if (!son) continue;
          if (son.kod === "B") map.delete(gun);
          else map.set(gun, { gun, ...son });
        }
        return { ...s, gunler: [...map.values()] };
      }),
    );
  }

  const gorunen = useMemo(() => {
    const s = arama.toLocaleLowerCase("tr");
    if (!s) return satirlar.map((_, i) => i);
    return satirlar
      .map((row, i) => ({ row, i }))
      .filter(({ row }) =>
        `${row.adi} ${row.soyadi} ${row.gorevi}`.toLocaleLowerCase("tr").includes(s),
      )
      .map(({ i }) => i);
  }, [arama, satirlar]);

  const ozet = useMemo(
    () =>
      satirlar.map((s) => {
        const calisan = s.gunler.filter((g) => g.kod === "C");
        const saat = calisan.reduce((t, g) => t + gunSaati(g, molaSaat), 0);
        return {
          gun: calisan.length,
          saat,
          mesai: Math.max(0, saat - normalAylikSaat),
          eksikSaat: calisan.filter((g) => !g.giris || !g.cikis).length,
          eksikAy: saat < normalAylikSaat,
        };
      }),
    [satirlar, normalAylikSaat, molaSaat],
  );
  const uyariSayisi = ozet.filter((o) => o.eksikSaat || o.eksikAy).length;

  function kaydet() {
    start(async () => {
      await puantajKaydet({
        yil,
        ay,
        satirlar: satirlar.map((s) => ({
          personelId: s.personelId,
          gunler: s.gunler.map((g) => ({
            ...g,
            saat: g.kod === "C" ? gunSaati(g, molaSaat) : 0,
          })),
        })),
      });
      setMesaj("Puantaj kaydedildi.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="sheet flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <span className="px-2 text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
          Boya kalemi
        </span>
        {MODLAR.map((m) => (
          <button
            key={m.kod}
            type="button"
            onClick={() => setMod(m.kod)}
            className={`btn ${mod === m.kod ? "btn-primary" : "btn-ghost"}`}
          >
            {m.etiket}
          </button>
        ))}
        <button type="button" className="btn btn-brass ml-auto" onClick={kaydet} disabled={pending}>
          {pending ? "Kaydediliyor…" : `${AYLAR[ay - 1]} puantajını kaydet`}
        </button>
      </div>

      <p className="text-sm text-ink-soft/70">
        Burada kod basılır. Giriş-çıkış ve günlük saat ayrı sayfadan yazılır. Mesai, ay toplamının{" "}
        {saatEtiket(normalAylikSaat)} saati aşan kısmıdır. Resmi tatilde “Çalıştı” basılırsa tatil
        mesaisi (%100) yazılır.
      </p>
      {uyariSayisi ? (
        <p className="text-sm font-semibold text-[#8a2e22]">
          {uyariSayisi} kişide eksik giriş-çıkış veya 180 saat altı var (kırmızı satır).
        </p>
      ) : null}

      <div className="filter-bar sheet rounded-2xl !mb-0">
        <SearchBar value={arama} onChange={setArama} placeholder="Personel veya görev yeri ara…" />
        <p className="pb-1 text-sm text-ink-soft/70">{gorunen.length} kişi</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            toplu((_, gun) => {
              const hd = haftaGunu(yil, ay, gun);
              if (hd === 0 || hd === 6 || tatilGunleri.has(gun)) return null;
              return calistiHucre();
            })
          }
        >
          Hafta içini doldur
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            toplu((_, gun) => (haftaGunu(yil, ay, gun) === 0 ? { kod: "H", saat: 0, giris: "", cikis: "" } : null))
          }
        >
          Pazarları tatil
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            toplu((_, gun) => (haftaGunu(yil, ay, gun) === 6 ? { kod: "H", saat: 0, giris: "", cikis: "" } : null))
          }
        >
          Cumartesileri tatil
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            toplu((_, gun) => (tatilGunleri.has(gun) ? { kod: "T", saat: 0, giris: "", cikis: "" } : null))
          }
        >
          Resmi tatilleri işle
        </button>
      </div>
      {mesaj ? <p className="text-sm text-sage">{mesaj}</p> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-44 bg-[#f3eee4]">Personel</th>
              {Array.from({ length: gunSayisi }, (_, i) => i + 1).map((gun) => {
                const hd = haftaGunu(yil, ay, gun);
                const ozel = hd === 0 || tatilGunleri.has(gun);
                return (
                  <th key={gun} className={`min-w-14 text-center ${ozel ? "bg-[#eadfd0]" : ""}`}>
                    <div>{gun}</div>
                    <div className="font-sans tracking-normal text-[0.62rem] opacity-60">
                      {GUN_KISA[hd]}
                    </div>
                  </th>
                );
              })}
              <th>Ç.gün</th>
              <th>Saat</th>
              <th>Mesai</th>
            </tr>
          </thead>
          <tbody>
            {gorunen.map((i) => {
              const s = satirlar[i];
              return (
                <tr
                key={s.personelId}
                className={ozet[i].eksikSaat || ozet[i].eksikAy ? "bg-[#f6e1dc]/40" : undefined}
              >
                  <td className="sticky left-0 z-10 bg-[#fffdf8]">
                    <div className="font-semibold">
                      {s.adi} {s.soyadi}
                    </div>
                    <div className="text-[0.7rem] text-ink-soft/70">{s.gorevi}</div>
                  </td>
                  {Array.from({ length: gunSayisi }, (_, d) => d + 1).map((gun) => {
                    const h = hucreBul(s, gun);
                    const ozel = haftaGunu(yil, ay, gun) === 0 || tatilGunleri.has(gun);
                    return (
                      <td
                        key={gun}
                        onClick={() => uygula(s.personelId, gun)}
                        className={`cursor-pointer p-0 text-center ${ozel ? "bg-[#f6eee2]" : ""}`}
                      >
                        {h.kod === "C" ? (
                          <span className="puantaj-saat">
                            <strong>{saatEtiket(gunSaati(h, molaSaat))}</strong>
                            {h.giris && h.cikis ? (
                              <span className="aralik">
                                {h.giris.slice(0, 5)}–{h.cikis.slice(0, 5)}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className={kodSinif(h.kod)}>
                            {PUANTAJ_KODLARI[h.kod as PuantajKod]?.kisa}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="font-semibold">{ozet[i].gun}</td>
                  <td>{saatEtiket(ozet[i].saat)}</td>
                  <td className={ozet[i].mesai > 0 ? "font-semibold text-brass" : ""}>
                    {saatEtiket(ozet[i].mesai)}
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

function kodSinif(kod: string) {
  const taban =
    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-extrabold";
  if (kod === "I") return `${taban} bg-[#f8ead0] text-[#7a4d0d]`;
  if (kod === "R") return `${taban} bg-[#f6e1dc] text-[#8a2e22]`;
  if (kod === "M") return `${taban} bg-[#e8dff3] text-[#5b3d86]`;
  if (kod === "H") return `${taban} bg-[#ece7de] text-[#4d5a53]`;
  if (kod === "T") return `${taban} bg-[#dce8f4] text-[#1f4e79]`;
  return taban;
}

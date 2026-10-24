"use client";

import { useMemo, useState, useTransition } from "react";
import { resmiTatilleriKaydet } from "@/lib/actions";
import { AYLAR } from "@/lib/format";
import { tatilAdi, tarihYazi, yilinSabitTatilleri } from "@/lib/tatiller";

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

function ymd(yil: number, ay: number, gun: number) {
  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

function pazartesiIndex(yil: number, ay: number, gun: number) {
  const js = new Date(yil, ay - 1, gun).getDay();
  return (js + 6) % 7;
}

export function TatilTakvimi({ baslangic }: { baslangic: string[] }) {
  const bugun = new Date();
  const [yil, setYil] = useState(bugun.getFullYear());
  const [ay, setAy] = useState(bugun.getMonth() + 1);
  const [secili, setSecili] = useState<string[]>(() => [...baslangic].sort());
  const [pending, start] = useTransition();
  const [mesaj, setMesaj] = useState("");

  const gunSayisi = new Date(yil, ay, 0).getDate();
  const bosluk = pazartesiIndex(yil, ay, 1);
  const set = useMemo(() => new Set(secili), [secili]);

  function kaydet(liste: string[]) {
    const sirali = [...new Set(liste)].sort();
    setSecili(sirali);
    start(async () => {
      await resmiTatilleriKaydet(sirali);
      setMesaj("Tatiller kaydedildi.");
    });
  }

  function toggle(tarih: string) {
    kaydet(set.has(tarih) ? secili.filter((t) => t !== tarih) : [...secili, tarih]);
  }

  function ayDegis(delta: number) {
    const d = new Date(yil, ay - 1 + delta, 1);
    setYil(d.getFullYear());
    setAy(d.getMonth() + 1);
  }

  const yilListesi = secili.filter((t) => t.startsWith(`${yil}-`));

  return (
    <div className="sheet rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-brass uppercase">Takvim</p>
          <h2 className="font-serif text-2xl">Resmi tatiller</h2>
          <p className="mt-1 text-sm text-ink-soft/75">
            Güne tıklayınca eklenir veya çıkarılır. Puantajda T olarak işaretlenir.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pending}
          onClick={() => {
            const eklenecek = yilinSabitTatilleri(yil).map((t) => t.tarih);
            kaydet([...secili, ...eklenecek]);
          }}
        >
          {yil} resmi günlerini ekle
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => ayDegis(-1)}>
              ‹
            </button>
            <p className="font-serif text-xl">
              {AYLAR[ay - 1]} {yil}
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => ayDegis(1)}>
              ›
            </button>
          </div>
          <div className="takvim">
            {GUNLER.map((g) => (
              <div key={g} className="takvim-baslik">
                {g}
              </div>
            ))}
            {Array.from({ length: bosluk }, (_, i) => (
              <div key={`b-${i}`} />
            ))}
            {Array.from({ length: gunSayisi }, (_, i) => {
              const gun = i + 1;
              const tarih = ymd(yil, ay, gun);
              const sec = set.has(tarih);
              const pazar = pazartesiIndex(yil, ay, gun) === 6;
              const bugunMu =
                gun === bugun.getDate() &&
                ay === bugun.getMonth() + 1 &&
                yil === bugun.getFullYear();
              return (
                <button
                  key={tarih}
                  type="button"
                  title={tatilAdi(tarih)}
                  onClick={() => toggle(tarih)}
                  className={`takvim-gun ${sec ? "secili" : ""} ${pazar ? "pazar" : ""} ${bugunMu ? "bugun" : ""}`}
                >
                  {gun}
                </button>
              );
            })}
          </div>
          {mesaj ? <p className="mt-3 text-sm text-sage">{pending ? "Kaydediliyor…" : mesaj}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-[0.7rem] font-bold tracking-[0.14em] text-ink-soft uppercase">
            {yil} · {yilListesi.length} gün
          </p>
          {yilListesi.length === 0 ? (
            <p className="text-sm text-ink-soft/70">Bu yıl henüz tatil seçilmedi.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {yilListesi.map((t) => (
                <li key={t} className="tatil-satir">
                  <div>
                    <p className="font-semibold">{tarihYazi(t)}</p>
                    <p className="text-xs text-ink-soft/70">{tatilAdi(t)}</p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => toggle(t)}>
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

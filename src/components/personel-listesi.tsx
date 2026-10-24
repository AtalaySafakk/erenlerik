"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchBar } from "@/components/field-select";

export type PersonelSatir = {
  id: number;
  ad: string;
  yer: string;
  gorevi: string;
  gsm: string;
  maas: string;
  resmi: string;
  bes: boolean;
  icra: boolean;
  izin: string;
  durum: string;
  pasif: boolean;
};

export function PersonelListesi({ satirlar }: { satirlar: PersonelSatir[] }) {
  const [q, setQ] = useState("");
  const liste = useMemo(() => {
    const s = q.toLocaleLowerCase("tr");
    if (!s) return satirlar;
    return satirlar.filter((p) =>
      `${p.ad} ${p.yer} ${p.gorevi} ${p.gsm}`.toLocaleLowerCase("tr").includes(s),
    );
  }, [q, satirlar]);

  return (
    <div>
      <div className="filter-bar sheet rounded-2xl">
        <SearchBar value={q} onChange={setQ} placeholder="Ad, görev yeri, görev, telefon…" />
        <p className="pb-1 text-sm text-ink-soft/70">{liste.length} kişi</p>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Ad soyad</th>
              <th>Görev yeri</th>
              <th>Görevi</th>
              <th>GSM</th>
              <th>Net / resmi</th>
              <th>BES</th>
              <th>İcra</th>
              <th>İzin kalan</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">{p.ad}</td>
                <td>{p.yer}</td>
                <td>{p.gorevi}</td>
                <td>{p.gsm}</td>
                <td>
                  {p.maas}
                  <div className="text-xs text-ink-soft/70">{p.resmi}</div>
                </td>
                <td>
                  <span className={`chip ${p.bes ? "chip-warn" : "chip-mute"}`}>
                    {p.bes ? "BES" : "—"}
                  </span>
                </td>
                <td>
                  <span className={`chip ${p.icra ? "chip-bad" : "chip-ok"}`}>
                    {p.icra ? "İCRA VAR" : "İCRA YOK"}
                  </span>
                </td>
                <td>{p.izin}</td>
                <td>
                  <span className={`chip ${p.pasif ? "chip-mute" : "chip-ok"}`}>{p.durum}</span>
                </td>
                <td>
                  <Link className="text-sm font-semibold text-sage underline" href={`/personel/${p.id}`}>
                    Kart
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { izinGunSayisi } from "@/lib/format";

export function IzinTarihAlanlari({
  tatiller = [],
  sadeceIsGunleri = false,
}: {
  tatiller?: string[];
  sadeceIsGunleri?: boolean;
}) {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const gun = izinGunSayisi(baslangic, bitis, { sadeceIsGunleri, tatiller });

  function baslangicYaz(v: string) {
    setBaslangic(v);
    if (v && (!bitis || bitis < v)) setBitis(v);
  }

  function bitisYaz(v: string) {
    if (baslangic && v && v < baslangic) {
      setBitis(baslangic);
      return;
    }
    setBitis(v);
  }

  return (
    <>
      <label className="field">
        <span>Başlangıç</span>
        <input
          type="date"
          name="baslangic"
          required
          value={baslangic}
          onChange={(e) => baslangicYaz(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Bitiş</span>
        <input
          type="date"
          name="bitis"
          required
          min={baslangic || undefined}
          value={bitis}
          onChange={(e) => bitisYaz(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Gün</span>
        <input name="gun" value={gun || ""} readOnly placeholder="Tarih seçince dolar" />
      </label>
      {sadeceIsGunleri ? (
        <p className="text-xs leading-5 text-ink-soft/70">
          Cumartesi, pazar ve resmi tatil gün hakkından düşülmez, puantaja da yazılmaz.
        </p>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Secenek = { value: string; label: string };

export function FieldSelect({
  name,
  options,
  defaultValue,
  required,
  arama = false,
  placeholder = "Seçin",
  onChange,
}: {
  name: string;
  options: Secenek[];
  defaultValue?: string | number;
  required?: boolean;
  arama?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const id = useId();
  const kutu = useRef<HTMLDivElement>(null);
  const [acik, setAcik] = useState(false);
  const [aramaMetin, setAramaMetin] = useState("");
  const [value, setValue] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const secili = options.find((o) => o.value === value);
  const ara = arama || options.length > 7;
  const liste = options.filter((o) =>
    o.label.toLocaleLowerCase("tr").includes(aramaMetin.toLocaleLowerCase("tr")),
  );

  useEffect(() => {
    function disari(e: MouseEvent) {
      if (!kutu.current?.contains(e.target as Node)) setAcik(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAcik(false);
    }
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <div className="select-wrap" ref={kutu}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        className={`select-btn ${acik ? "open" : ""}`}
        aria-expanded={acik}
        aria-controls={id}
        onClick={() => setAcik((v) => !v)}
      >
        <span className={secili ? "" : "placeholder"}>{secili?.label ?? placeholder}</span>
        <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {acik ? (
        <div className="select-menu" id={id} role="listbox">
          {ara ? (
            <div className="select-search">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20 L16.5 16.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                autoFocus
                value={aramaMetin}
                onChange={(e) => setAramaMetin(e.target.value)}
                placeholder="Ara…"
              />
            </div>
          ) : null}
          <ul>
            {liste.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  className={o.value === value ? "aktif" : ""}
                  onClick={() => {
                    setValue(o.value);
                    onChange?.(o.value);
                    setAcik(false);
                    setAramaMetin("");
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {liste.length === 0 ? <li className="bos">Kayıt yok</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Ara…",
  name,
  defaultValue,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  name?: string;
  defaultValue?: string;
}) {
  return (
    <label className="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20 L16.5 16.5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <input
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
      />
    </label>
  );
}

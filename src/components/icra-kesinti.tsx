"use client";

import { useState } from "react";
import { FieldSelect } from "@/components/field-select";

export function IcraKesintiAlanlari() {
  const [tip, setTip] = useState("TUTAR");
  const yuzde = tip === "YUZDE";

  return (
    <>
      <label className="field">
        <span>Kesinti türü</span>
        <FieldSelect
          name="kesintiTip"
          defaultValue={tip}
          onChange={setTip}
          options={[
            { value: "TUTAR", label: "Sabit tutar (₺)" },
            { value: "YUZDE", label: "Net maaşın yüzdesi" },
          ]}
        />
      </label>
      <label className="field">
        <span>{yuzde ? "Aylık kesinti (%)" : "Aylık kesinti (₺)"}</span>
        <input
          name={yuzde ? "kesintiYuzde" : "kesinti"}
          required
          inputMode="decimal"
          placeholder={yuzde ? "Örn. 25" : "Örn. 2500"}
        />
      </label>
    </>
  );
}

"use client";
import { useRouter } from "next/navigation";

/** Sport picker: a native select that navigates. */
export function SportSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2.5 text-[13px] text-faint">
      Sport
      <select
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        className="press h-8 rounded-md border border-hair bg-shoal px-2 text-[13px] text-fg hover:border-hair-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

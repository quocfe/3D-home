import { useEffect, useState } from "react";
export function NumberField({
  label,
  value,
  min = 100,
  max = 10000,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setError(false);
  }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (!Number.isInteger(n)) {
      setError(true);
      return;
    }
    onCommit(n);
    if (n < min || n > max) {
      setError(true);
      return;
    }
    setError(false);
  };
  return (
    <label className="number-field">
      <span>{label}</span>
      <span className="number-control">
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step="50"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-invalid={error}
        />
        <small>mm</small>
      </span>
      {error && (
        <small className="danger">
          Nhập số nguyên {min}–{max} mm.
        </small>
      )}
    </label>
  );
}

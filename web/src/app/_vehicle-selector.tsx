'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

export interface VehicleSelection {
  make: string;
  model: string;
  year: string;
}

interface VehicleSelectorProps {
  value: VehicleSelection;
  onChange: (next: VehicleSelection) => void;
  required?: boolean;
}

const POPULAR_MAKES = [
  'Acura', 'Audi', 'BMW', 'BYD', 'Cadillac', 'Caterpillar', 'Chevrolet', 'Chrysler',
  'Dodge', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
  'Jeep', 'John Deere', 'Kia', 'Komatsu', 'Land Rover', 'Lexus', 'Lincoln', 'Mack',
  'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram',
  'Range Rover', 'Renault', 'Scania', 'Subaru', 'Suzuki', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
];

const MODEL_OVERRIDES: Record<string, string[]> = {
  BMW: ['3 Series (E90)', '3 Series (F30)', '5 Series (E60)', '5 Series (F10)', 'X5 (E70)'],
  Nissan: ['Qashqai', 'Qashqai J10', 'Qashqai J11', 'Qashqai J12', 'X-Trail T31', 'X-Trail T32'],
  Toyota: ['Land Cruiser 200', 'Land Cruiser Prado 150', 'RAV4 XA40', 'RAV4 XA50'],
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

async function fetchModels(make: string): Promise<string[]> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`
  );
  const overrideModels = MODEL_OVERRIDES[make] ?? [];
  if (!res.ok) return overrideModels;
  const json = await res.json() as { Results: { Model_Name: string }[] };
  const upstreamModels = (json.Results ?? []).map((r) => r.Model_Name.trim()).filter(Boolean);
  return Array.from(new Set([...overrideModels, ...upstreamModels])).sort((a, b) => a.localeCompare(b));
}

export default function VehicleSelector({ value, onChange, required = false }: VehicleSelectorProps) {
  const t = useT();
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!value.make) {
      setModels([]);
      if (value.model) onChange({ ...value, model: '' });
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    fetchModels(value.make)
      .then((list) => {
        if (cancelled) return;
        setModels(list);
        if (value.model && !list.includes(value.model)) onChange({ ...value, model: '' });
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.make, value.model, value.year]);

  return (
    <>
      <div className="gen-input-wrap">
        <label className="gen-label">{t.vehicleSelector.brand} {required && <span className="gen-label-required">*</span>}</label>
        <select
          className="gen-input gen-input--select"
          value={value.make}
          required={required}
          onChange={(e) => onChange({ make: e.target.value, model: '', year: value.year })}
        >
          <option value="">{t.vehicleSelector.selectBrand}</option>
          {POPULAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="gen-input-wrap">
        <label className="gen-label">{t.vehicleSelector.model} {required && <span className="gen-label-required">*</span>}</label>
        <select
          className="gen-input gen-input--select"
          value={value.model}
          required={required}
          disabled={!value.make || loadingModels}
          onChange={(e) => onChange({ ...value, model: e.target.value })}
        >
          <option value="">{loadingModels ? t.vehicleSelector.loading : t.vehicleSelector.selectModel}</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="gen-input-wrap">
        <label className="gen-label">{t.vehicleSelector.year} {required && <span className="gen-label-required">*</span>}</label>
        <select
          className="gen-input gen-input--select"
          value={value.year}
          required={required}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
        >
          <option value="">{t.vehicleSelector.selectYear}</option>
          {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
    </>
  );
}

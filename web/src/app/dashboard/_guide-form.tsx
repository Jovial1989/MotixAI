'use client';

import { useState, useEffect } from 'react';
import VehicleSelector from '../_vehicle-selector';
import { useT } from '@/lib/i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GuideFormData {
  vehicleModel: string;
  vin?: string;
  partName: string;
  oemNumber?: string;
}

interface Props {
  onSubmit: (data: GuideFormData) => Promise<void>;
  submitting: boolean;
  error: string | null;
  initialQuery?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DISAMBIGUATION: Record<string, string[]> = {
  brakes:   ['Brake pads replacement', 'Brake caliper rebuild', 'Brake rotor resurfacing', 'Brake fluid flush', 'ABS sensor replacement'],
  brake:    ['Brake pads replacement', 'Brake caliper rebuild', 'Brake rotor resurfacing', 'Brake fluid flush', 'ABS sensor replacement'],
  oil:      ['Engine oil & filter change', 'Transmission fluid change', 'Differential oil change', 'Power steering fluid flush', 'Transfer case fluid service'],
  battery:  ['12V battery replacement', 'Battery terminal cleaning', 'Alternator testing & replacement', 'Charging system diagnosis'],
  suspension: ['Shock absorber replacement', 'Strut replacement', 'Control arm bushing replacement', 'Ball joint replacement', 'CV axle replacement'],
  steering: ['Power steering fluid flush', 'Steering rack replacement', 'Tie rod end replacement', 'Wheel alignment', 'Power steering pump replacement'],
  ac:       ['AC compressor replacement', 'AC refrigerant recharge', 'Cabin air filter replacement', 'AC condenser replacement', 'Blower motor replacement'],
  'air conditioning': ['AC compressor replacement', 'AC refrigerant recharge', 'Cabin air filter replacement', 'AC condenser replacement'],
  transmission: ['Transmission fluid service', 'Clutch kit replacement', 'Transmission mount replacement', 'Shift solenoid replacement', 'Gearbox overhaul'],
  engine:   ['Timing belt/chain replacement', 'Spark plug replacement', 'Engine air filter replacement', 'Head gasket repair', 'Engine mount replacement'],
  noise:    ['Brake squeal diagnosis', 'Suspension rattle diagnosis', 'Engine knock diagnosis', 'Exhaust leak repair', 'Heat shield rattle fix'],
  cooling:  ['Radiator flush', 'Thermostat replacement', 'Water pump replacement', 'Coolant hose replacement', 'Cooling fan replacement'],
  exhaust:  ['Exhaust manifold gasket replacement', 'Catalytic converter replacement', 'Muffler replacement', 'Oxygen sensor replacement'],
  fuel:     ['Fuel filter replacement', 'Fuel pump replacement', 'Fuel injector cleaning', 'Throttle body cleaning'],
  electrical: ['Alternator replacement', 'Starter motor replacement', 'Fuse box diagnosis', 'Ground strap replacement'],
  hydraulic: ['Hydraulic pump replacement', 'Hydraulic hose replacement', 'Hydraulic cylinder rebuild', 'Hydraulic fluid change', 'Control valve service'],
};

function getDisambiguation(text: string): string[] | null {
  const lower = text.toLowerCase();
  for (const [key, options] of Object.entries(DISAMBIGUATION)) {
    // Use word boundary match to avoid false positives
    // e.g. "replacing" should NOT match "ac"
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(lower)) return options;
  }
  return null;
}

// ── NHTSA helpers ─────────────────────────────────────────────────────────────

interface NHTSAVinResult {
  Make: string; Model: string; ModelYear: string;
  Manufacturer: string; BodyClass: string;
  ErrorCode: string; ErrorText: string;
}

async function decodeVin(vin: string): Promise<NHTSAVinResult | null> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`
  );
  if (!res.ok) return null;
  const json = await res.json() as { Results: NHTSAVinResult[] };
  const r = json.Results?.[0];
  if (!r || r.ErrorCode !== '0') return null;
  return r;
}

// ── SmartGuideForm ────────────────────────────────────────────────────────────

export default function SmartGuideForm({ onSubmit, submitting, error, initialQuery }: Props) {
  const t = useT();

  // ALL hooks must be declared at top level before any conditional return.
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idMode, setIdMode] = useState<'vin' | 'manual'>('manual');
  const [vinInput, setVinInput] = useState('');
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [decodedVin, setDecodedVin] = useState<NHTSAVinResult | null>(null);
  const [selMake, setSelMake] = useState('');
  const [selModel, setSelModel] = useState('');
  const [selYear, setSelYear] = useState('');
  const [partName, setPartName] = useState(initialQuery ?? '');
  const [oemNumber, setOemNumber] = useState('');
  const [disambigOptions, setDisambigOptions] = useState<string[] | null>(null);

  const vehicleModel = idMode === 'vin' && decodedVin
    ? `${decodedVin.ModelYear} ${decodedVin.Make} ${decodedVin.Model}`.trim()
    : [selYear, selMake, selModel].filter(Boolean).join(' ');
  const vinForSubmit = idMode === 'vin' ? vinInput.trim().toUpperCase() : '';
  const step1Valid = idMode === 'vin' ? !!decodedVin : !!(selMake && selModel && selYear);
  const step2Valid = partName.trim().length >= 2;

  useEffect(() => {
    setDisambigOptions(partName.length >= 2 ? getDisambiguation(partName) : null);
  }, [partName]);

  async function handleVinDecode() {
    const vin = vinInput.trim().toUpperCase();
    if (vin.length < 11) { setVinError(t.guideForm.vinError11); return; }
    setVinError(''); setVinDecoding(true);
    try {
      const result = await decodeVin(vin);
      if (!result) setVinError(t.guideForm.couldNotDecodeVin);
      else setDecodedVin(result);
    } catch { setVinError(t.guideForm.networkError); }
    finally { setVinDecoding(false); }
  }

  async function handleSubmit() {
    await onSubmit({ vehicleModel, vin: vinForSubmit || undefined, partName: partName.trim(), oemNumber: oemNumber.trim() || undefined });
  }

  // ── Step 1 ───────────────────────────────────────────────────────────────

  if (step === 1) return (
    <div className="gen-form">
      <div className="gen-form-header">
        <div className="gen-form-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 11l2-5h8l2 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <rect x="2" y="11" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="5.5" cy="15" r="1" fill="currentColor"/>
            <circle cx="12.5" cy="15" r="1" fill="currentColor"/>
          </svg>
        </div>
        <span className="gen-form-title">{t.guideForm.step1title}</span>
        <span className="sgf-step-badge">1 / 3</span>
      </div>

      <div className="sgf-mode-tabs">
        <button type="button" className={`sgf-mode-tab${idMode === 'manual' ? ' sgf-mode-tab--active' : ''}`}
          onClick={() => { setIdMode('manual'); setDecodedVin(null); setVinError(''); }}>{t.guideForm.manualEntry}</button>
        <button type="button" className={`sgf-mode-tab${idMode === 'vin' ? ' sgf-mode-tab--active' : ''}`}
          onClick={() => { setIdMode('vin'); setDecodedVin(null); setVinError(''); }}>{t.guideForm.vinDecode}</button>
      </div>

      {idMode === 'manual' ? (
        <div className="gen-inputs">
          <VehicleSelector value={{ make: selMake, model: selModel, year: selYear }}
            onChange={(next) => { setSelMake(next.make); setSelModel(next.model); setSelYear(next.year); }} required />
          <div className="gen-input-wrap">
            <label className="gen-label">{t.guideForm.vinOptional} <span className="gen-label-or">{t.common.optional}</span></label>
            <input className="gen-input" value={vinInput} onChange={(e) => setVinInput(e.target.value.toUpperCase())}
              placeholder={t.guideForm.vinPlaceholder} maxLength={17} />
          </div>
        </div>
      ) : (
        <div className="gen-inputs gen-inputs--col">
          <div className="gen-input-wrap">
            <label className="gen-label">{t.guideForm.vinNumber} <span className="gen-label-required">*</span></label>
            <div className="sgf-vin-row">
              <input className="gen-input" value={vinInput}
                onChange={(e) => { setVinInput(e.target.value.toUpperCase()); setDecodedVin(null); setVinError(''); }}
                placeholder={t.guideForm.vinPlaceholder} maxLength={17} />
              <button type="button" className="sgf-decode-btn" onClick={handleVinDecode}
                disabled={vinDecoding || vinInput.trim().length < 11}>
                {vinDecoding ? <span className="gen-spinner" /> : t.guideForm.decode}
              </button>
            </div>
            {vinError && <p className="sgf-field-error">{vinError}</p>}
          </div>
          {decodedVin && (
            <div className="sgf-decoded-card">
              <div className="sgf-decoded-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="sgf-decoded-model">{decodedVin.ModelYear} {decodedVin.Make} {decodedVin.Model}</p>
                <p className="sgf-decoded-sub">{decodedVin.Manufacturer} · {decodedVin.BodyClass || t.guideForm.vehicleLabel}</p>
              </div>
              <button type="button" className="sgf-clear-btn" onClick={() => { setDecodedVin(null); setVinInput(''); }}>✕</button>
            </div>
          )}
        </div>
      )}

      <button type="button" className="gen-btn" disabled={!step1Valid} onClick={() => setStep(2)}>
        {t.guideForm.continue}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );

  // ── Step 2 ───────────────────────────────────────────────────────────────

  if (step === 2) return (
    <div className="gen-form">
      <div className="gen-form-header">
        <div className="gen-form-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 4l-3 3M4 14l3-3M9 9l3-3-1-4-4 1-3 3 4 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="gen-form-title">{t.guideForm.step2title}</span>
        <span className="sgf-step-badge">2 / 3</span>
      </div>

      <div className="sgf-vehicle-pill">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 7.5l1.5-3.5h5l1.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <rect x="1" y="7.5" width="10" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        {vehicleModel}
        <button type="button" className="sgf-back-inline" onClick={() => setStep(1)}>{t.guideForm.edit}</button>
      </div>

      <div className="gen-inputs gen-inputs--col">
        <div className="gen-input-wrap">
          <label className="gen-label">{t.guideForm.partRepairDesc} <span className="gen-label-required">*</span></label>
          <input className="gen-input" value={partName} onChange={(e) => setPartName(e.target.value)}
            placeholder={t.guideForm.partPlaceholder} autoFocus />
          {disambigOptions && (
            <div className="sgf-disambig">
              <p className="sgf-disambig-label">{t.guideForm.didYouMean}</p>
              <div className="sgf-chips">
                {disambigOptions.map((opt) => (
                  <button key={opt} type="button" className={`sgf-chip${partName === opt ? ' sgf-chip--active' : ''}`}
                    onClick={() => { setPartName(opt); setDisambigOptions(null); }}>{opt}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="gen-input-wrap">
          <label className="gen-label">{t.guideForm.oemPartNumber} <span className="gen-label-or">{t.common.optional}</span></label>
          <input className="gen-input" value={oemNumber} onChange={(e) => setOemNumber(e.target.value)} placeholder={t.guideForm.oemPlaceholder} />
        </div>
      </div>

      <div className="sgf-btn-row">
        <button type="button" className="sgf-back-btn" onClick={() => setStep(1)}>{`← ${t.guideForm.back}`}</button>
        <button type="button" className="gen-btn sgf-btn-grow" disabled={!step2Valid} onClick={() => setStep(3)}>
          {t.guideForm.review}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );

  // ── Step 3 — Confirmation ─────────────────────────────────────────────────

  return (
    <div className="gen-form">
      <div className="gen-form-header">
        <div className="gen-form-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
        </div>
        <span className="gen-form-title">{t.guideForm.step3title}</span>
        <span className="sgf-step-badge">3 / 3</span>
      </div>

      <div className="sgf-confirm-card">
        <div className="sgf-confirm-row">
          <span className="sgf-confirm-label">{t.guideForm.vehicleLabel}</span>
          <span className="sgf-confirm-value">{vehicleModel}</span>
        </div>
        {vinForSubmit && (
          <div className="sgf-confirm-row">
            <span className="sgf-confirm-label">{t.guideForm.vinLabel}</span>
            <span className="sgf-confirm-value sgf-confirm-mono">{vinForSubmit}</span>
          </div>
        )}
        <div className="sgf-confirm-row">
          <span className="sgf-confirm-label">{t.guideForm.repairLabel}</span>
          <span className="sgf-confirm-value">{partName}</span>
        </div>
        {oemNumber && (
          <div className="sgf-confirm-row">
            <span className="sgf-confirm-label">{t.guideForm.partNoLabel}</span>
            <span className="sgf-confirm-value sgf-confirm-mono">{oemNumber}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="dash-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      <div className="sgf-btn-row">
        <button type="button" className="sgf-back-btn" onClick={() => setStep(2)}>{`← ${t.guideForm.back}`}</button>
        <button type="button" className="gen-btn sgf-btn-grow" disabled={submitting} onClick={handleSubmit}>
          {submitting ? (
            <><span className="gen-spinner" /> {t.guideForm.generatingGuide}</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.guideForm.generateGuide}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

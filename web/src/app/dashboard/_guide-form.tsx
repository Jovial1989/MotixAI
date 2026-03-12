'use client';

import { useState, useEffect } from 'react';
import VehicleSelector from '../_vehicle-selector';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GuideFormData {
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

// disambiguation map: keyword → specific repair options
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
    if (lower.includes(key)) return options;
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function SmartGuideForm({ onSubmit, submitting, error, initialQuery }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — vehicle identification
  const [idMode, setIdMode] = useState<'vin' | 'manual'>('vin');
  const [vinInput, setVinInput] = useState('');
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [decodedVin, setDecodedVin] = useState<NHTSAVinResult | null>(null);
  const [selMake, setSelMake] = useState('');
  const [selModel, setSelModel] = useState('');
  const [selYear, setSelYear] = useState('');

  // Step 2 — repair description
  const [partName, setPartName] = useState(initialQuery ?? '');
  const [oemNumber, setOemNumber] = useState('');
  const [disambigOptions, setDisambigOptions] = useState<string[] | null>(null);

  // Vehicle model string derived from step 1
  const vehicleModel = idMode === 'vin' && decodedVin
    ? `${decodedVin.ModelYear} ${decodedVin.Make} ${decodedVin.Model}`.trim()
    : [selYear, selMake, selModel].filter(Boolean).join(' ');

  const vinForSubmit = idMode === 'vin' ? vinInput.trim().toUpperCase() : '';

  const step1Valid = idMode === 'vin'
    ? !!decodedVin
    : !!(selMake && selModel && selYear);

  const step2Valid = partName.trim().length >= 2;

  // Disambiguation chips when part name changes
  useEffect(() => {
    setDisambigOptions(partName.length >= 2 ? getDisambiguation(partName) : null);
  }, [partName]);

  async function handleVinDecode() {
    const vin = vinInput.trim().toUpperCase();
    if (vin.length < 11) { setVinError('Enter at least 11 characters'); return; }
    setVinError('');
    setVinDecoding(true);
    try {
      const result = await decodeVin(vin);
      if (!result) { setVinError('Could not decode VIN — check the number and try again'); }
      else setDecodedVin(result);
    } catch {
      setVinError('Network error — check your connection');
    } finally {
      setVinDecoding(false);
    }
  }

  async function handleSubmit() {
    await onSubmit({
      vehicleModel,
      vin: vinForSubmit || undefined,
      partName: partName.trim(),
      oemNumber: oemNumber.trim() || undefined,
    });
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
        <span className="gen-form-title">Step 1 of 3 — Identify vehicle</span>
        <span className="sgf-step-badge">1 / 3</span>
      </div>

      {/* Mode toggle */}
      <div className="sgf-mode-tabs">
        <button
          type="button"
          className={`sgf-mode-tab${idMode === 'vin' ? ' sgf-mode-tab--active' : ''}`}
          onClick={() => { setIdMode('vin'); setDecodedVin(null); setVinError(''); }}
        >VIN decode</button>
        <button
          type="button"
          className={`sgf-mode-tab${idMode === 'manual' ? ' sgf-mode-tab--active' : ''}`}
          onClick={() => { setIdMode('manual'); setDecodedVin(null); setVinError(''); }}
        >Manual entry</button>
      </div>

      {idMode === 'vin' ? (
        <div className="gen-inputs gen-inputs--col">
          <div className="gen-input-wrap">
            <label className="gen-label">VIN number <span className="gen-label-required">*</span></label>
            <div className="sgf-vin-row">
              <input
                className="gen-input"
                value={vinInput}
                onChange={(e) => { setVinInput(e.target.value.toUpperCase()); setDecodedVin(null); setVinError(''); }}
                placeholder="e.g. 1HGBH41JXMN109186"
                maxLength={17}
              />
              <button
                type="button"
                className="sgf-decode-btn"
                onClick={handleVinDecode}
                disabled={vinDecoding || vinInput.trim().length < 11}
              >
                {vinDecoding ? <span className="gen-spinner" /> : 'Decode'}
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
                <p className="sgf-decoded-sub">{decodedVin.Manufacturer} · {decodedVin.BodyClass || 'Vehicle'}</p>
              </div>
              <button type="button" className="sgf-clear-btn" onClick={() => { setDecodedVin(null); setVinInput(''); }}>✕</button>
            </div>
          )}
        </div>
      ) : (
        <div className="gen-inputs">
          <VehicleSelector
            value={{ make: selMake, model: selModel, year: selYear }}
            onChange={(next) => {
              setSelMake(next.make);
              setSelModel(next.model);
              setSelYear(next.year);
            }}
            required
          />
          <div className="gen-input-wrap">
            <label className="gen-label">VIN <span className="gen-label-or">optional</span></label>
            <input
              className="gen-input"
              value={vinInput}
              onChange={(e) => setVinInput(e.target.value.toUpperCase())}
              placeholder="e.g. 1HGBH41JXMN109186"
              maxLength={17}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className="gen-btn"
        disabled={!step1Valid}
        onClick={() => setStep(2)}
      >
        Continue
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
        <span className="gen-form-title">Step 2 of 3 — What needs repair?</span>
        <span className="sgf-step-badge">2 / 3</span>
      </div>

      <div className="sgf-vehicle-pill">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 7.5l1.5-3.5h5l1.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <rect x="1" y="7.5" width="10" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        {vehicleModel}
        <button type="button" className="sgf-back-inline" onClick={() => setStep(1)}>Edit</button>
      </div>

      <div className="gen-inputs gen-inputs--col">
        <div className="gen-input-wrap">
          <label className="gen-label">Part / repair description <span className="gen-label-required">*</span></label>
          <input
            className="gen-input"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder="e.g. Hydraulic pump, brakes, oil change…"
            autoFocus
          />
          {disambigOptions && (
            <div className="sgf-disambig">
              <p className="sgf-disambig-label">Did you mean:</p>
              <div className="sgf-chips">
                {disambigOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`sgf-chip${partName === opt ? ' sgf-chip--active' : ''}`}
                    onClick={() => { setPartName(opt); setDisambigOptions(null); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="gen-input-wrap">
          <label className="gen-label">OEM / part number <span className="gen-label-or">optional</span></label>
          <input
            className="gen-input"
            value={oemNumber}
            onChange={(e) => setOemNumber(e.target.value)}
            placeholder="e.g. 4633891"
          />
        </div>
      </div>

      <div className="sgf-btn-row">
        <button type="button" className="sgf-back-btn" onClick={() => setStep(1)}>← Back</button>
        <button type="button" className="gen-btn sgf-btn-grow" disabled={!step2Valid} onClick={() => setStep(3)}>
          Review
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
        <span className="gen-form-title">Step 3 of 3 — Confirm &amp; generate</span>
        <span className="sgf-step-badge">3 / 3</span>
      </div>

      <div className="sgf-confirm-card">
        <div className="sgf-confirm-row">
          <span className="sgf-confirm-label">Vehicle</span>
          <span className="sgf-confirm-value">{vehicleModel}</span>
        </div>
        {vinForSubmit && (
          <div className="sgf-confirm-row">
            <span className="sgf-confirm-label">VIN</span>
            <span className="sgf-confirm-value sgf-confirm-mono">{vinForSubmit}</span>
          </div>
        )}
        <div className="sgf-confirm-row">
          <span className="sgf-confirm-label">Repair</span>
          <span className="sgf-confirm-value">{partName}</span>
        </div>
        {oemNumber && (
          <div className="sgf-confirm-row">
            <span className="sgf-confirm-label">Part No.</span>
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
        <button type="button" className="sgf-back-btn" onClick={() => setStep(2)}>← Back</button>
        <button
          type="button"
          className="gen-btn sgf-btn-grow"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <><span className="gen-spinner" /> Generating…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Guide
            </>
          )}
        </button>
      </div>
    </div>
  );
}

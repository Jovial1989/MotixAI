import { SourceAdapter } from './source-adapter.interface';
import { SourcePackage, TaskType } from './source-package.types';

const SUPPORTED_MODELS = ['corolla', 'hilux', 'camry', 'rav4'];

type SeedKey = `${string}::${TaskType}`;

const SEED: Partial<Record<SeedKey, Omit<SourcePackage, 'make' | 'model' | 'year'>>> = {

  // ── Toyota Corolla — oil change ─────────────────────────────────────────────
  'corolla::oil_change': {
    component: 'Engine oil & filter (2ZR-FE)',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '30-45 min',
    tools: ['14mm socket (drain plug)', '64mm cartridge filter cap wrench', 'Drain pan (5L)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Allow engine to cool for at least 10 minutes before removing cartridge cap — hot oil under pressure will spray',
      'Do not overtighten the cartridge filter cap — it seals via an O-ring, not friction',
      'Use only 0W-20 fully synthetic as specified for the 2ZR-FE engine',
    ],
    sourceProvider: 'ToyoDIY',
    sourceReferences: [
      {
        title: 'Toyota Corolla 2014–2019 Oil Change (2ZR-FE 1.8) — ToyoDIY',
        url: 'https://www.toyodiy.com/corolla-1zr-oil-change',
        excerpt:
          'Drain plug torque is 30 Nm. The 2ZR-FE 1.8 takes 4.4 litres of 0W-20 fully synthetic. The oil filter is a cartridge type inside a 64mm plastic housing on the front-top of the engine block. Replace the O-ring with every oil change — the new filter element usually includes one.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and position drain pan',
        rawText:
          'Run the engine for 5 minutes to warm the oil, then shut off and wait 10 minutes. The drain plug is on the bottom of the sump — position a 5-litre drain pan directly beneath it.',
      },
      {
        order: 2,
        title: 'Remove drain plug and drain oil',
        rawText:
          'Use a 14mm socket to loosen the drain plug anticlockwise. Remove by hand and allow oil to drain for 5–8 minutes. The new drain plug gasket is a crush-type aluminium washer — replace it if the old one shows flattening or grooves.',
        torqueSpec: '30 Nm',
      },
      {
        order: 3,
        title: 'Remove cartridge filter and housing cap',
        rawText:
          'The filter housing is a 64mm black plastic cap on the front of the engine block. Use a 64mm cap wrench or equivalent to turn anticlockwise and remove. Pull out the old paper filter element. Note the O-ring at the base of the housing — remove it and discard.',
        warningNote: 'Position a rag under the housing — residual oil will spill when the cap opens.',
      },
      {
        order: 4,
        title: 'Install new filter element and O-ring',
        rawText:
          'Drop the new paper element into the housing. Fit the new O-ring (lightly lubricated with fresh engine oil) into the groove at the base of the housing cap. Thread the cap back on by hand, then torque to 25 Nm. Do not over-tighten — the plastic cap threads strip easily.',
        torqueSpec: '25 Nm (cap)',
      },
      {
        order: 5,
        title: 'Reinstall drain plug and fill with oil',
        rawText:
          'Thread the drain plug with a new washer and torque to 30 Nm. Open the oil filler cap and pour in 4.4 litres of 0W-20 fully synthetic via a funnel. Check dipstick — should read at MAX. Start engine, check for leaks, and verify level after 1 minute idle.',
        torqueSpec: '30 Nm (drain plug)',
      },
    ],
  },

  // ── Toyota Corolla — brake pad replacement ──────────────────────────────────
  'corolla::brake_pad_replacement': {
    component: 'Front brake pads',
    taskType: 'brake_pad_replacement',
    difficulty: 'Beginner',
    timeEstimate: '60-90 min',
    tools: [
      '21mm socket (wheel nuts)',
      '17mm socket (caliper mounting bolts)',
      '12mm socket (slide pin bolts)',
      'Caliper wind-back tool (clockwise piston)',
      'Brake cleaner spray',
      'Copper grease',
      'Torque wrench',
      'Jack and axle stands',
    ],
    safetyNotes: [
      'The 2ZR-FE Corolla rear caliper piston rotates clockwise to retract — front piston pushes straight in',
      'Keep brake fluid reservoir cap on tight during piston compression',
      'Bed in pads after fitting to cure the friction material',
    ],
    sourceProvider: 'ToyoDIY',
    sourceReferences: [
      {
        title: 'Toyota Corolla Front Brake Pad Replacement 2014–2019 — ToyoDIY',
        url: 'https://www.toyodiy.com/corolla-brake-pads',
        excerpt:
          'Caliper mounting bolts torque to 107 Nm, slide pin bolts to 32 Nm. The E170 Corolla uses a single-piston sliding caliper on all four corners. The front piston pushes straight back using a C-clamp; the rear piston rotates clockwise using a wind-back tool.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Loosen wheel nuts and raise front axle',
        rawText:
          'With the vehicle on flat ground, loosen the five wheel nuts half a turn while the tyre is still on the ground. Jack up the front and support on axle stands. Remove the wheel.',
        warningNote: 'Never trust only the hydraulic jack — always use rated axle stands.',
      },
      {
        order: 2,
        title: 'Remove caliper slide pin bolts',
        rawText:
          'The slide pins are two 12mm bolts at the back of the caliper. Remove both. Slide the caliper off the disc and hang it with a wire hook from the spring or coil. Do not let it dangle on the brake hose.',
      },
      {
        order: 3,
        title: 'Remove old pads and clean bracket',
        rawText:
          'Pull the two old pads out of the bracket carrier. Spray the carrier abutment surfaces with brake cleaner and scrub with a wire brush to remove rust and corrosion. Apply a small amount of copper grease to the abutment lands — not on the disc or pad friction faces.',
      },
      {
        order: 4,
        title: 'Compress caliper piston straight back',
        rawText:
          'Place a C-clamp or flat piston press tool against the piston face and the clamp frame against the rear of the caliper body. Slowly compress the piston fully into the bore. Watch the fluid reservoir for overflow.',
      },
      {
        order: 5,
        title: 'Fit new pads with anti-squeal shims',
        rawText:
          'Press the new inner pad (with wear indicator) against the piston. Fit the outer pad against the caliper bridge. Attach the anti-squeal shims to the back of each pad if included.',
      },
      {
        order: 6,
        title: 'Refit caliper and torque bolts',
        rawText:
          'Slide the caliper back over the pads and disc. Thread the slide pin bolts by hand, then torque to 32 Nm. Refit wheel, torque nuts to 103 Nm in a star pattern.',
        torqueSpec: 'Slide pins: 32 Nm | Wheel nuts: 103 Nm',
      },
      {
        order: 7,
        title: 'Pump pedal and perform bed-in',
        rawText:
          'Before driving, pump the brake pedal 10 times until it feels firm. Perform 5 light stops from 60 km/h to bed in the new pads. Avoid aggressive braking for 200 km.',
      },
    ],
  },

  // ── Toyota Hilux — oil change ────────────────────────────────────────────────
  'hilux::oil_change': {
    component: 'Engine oil & filter (1GD-FTV 2.8 diesel)',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '45-60 min',
    tools: ['17mm socket (drain plug)', '76mm oil filter wrench', 'Drain pan (9L)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Diesel engine oil contains combustion byproducts — wear nitrile gloves',
      'The 1GD-FTV holds 7.6 litres — use at least a 9-litre drain pan',
      'Use CJ-4 or CK-4 rated diesel oil — standard petrol oil specification is not adequate',
    ],
    sourceProvider: 'ToyoDIY',
    sourceReferences: [
      {
        title: 'Toyota Hilux 2.8 GD6 Oil Change (1GD-FTV) 2015–2023 — ToyoDIY',
        url: 'https://www.toyodiy.com/hilux-1gd-oil-change',
        excerpt:
          'Drain plug torque is 40 Nm. The 1GD-FTV 2.8 diesel takes 7.6 litres of 5W-30 or 5W-40 CJ-4 diesel oil. The spin-on filter sits on the front of the engine block and is accessible from underneath. Service interval is 10,000 km or 12 months under normal conditions.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and raise vehicle',
        rawText:
          'Run engine for 5 minutes then shut off. Allow 10 minutes to cool. Raise the Hilux on a vehicle ramp or support on rated axle stands under the chassis rails. Position a 9-litre drain pan under the sump drain plug at the front of the engine block.',
      },
      {
        order: 2,
        title: 'Remove drain plug and drain oil',
        rawText:
          'Use a 17mm socket to loosen the drain plug. Remove by hand and allow full drainage for 8–10 minutes — the large 2.8 diesel sump takes longer than a petrol engine. Inspect the aluminium crush washer and replace if flattened.',
        torqueSpec: '40 Nm',
      },
      {
        order: 3,
        title: 'Replace spin-on oil filter',
        rawText:
          'The 1GD-FTV filter is a spin-on canister on the front of the engine block, accessible from the underside. Use a 76mm filter wrench to loosen. Lubricate the new filter gasket with fresh oil. Screw new filter on hand-tight plus a quarter turn.',
      },
      {
        order: 4,
        title: 'Reinstall drain plug and fill with diesel oil',
        rawText:
          'Thread drain plug with new washer and torque to 40 Nm. Fill with 7.6 litres of 5W-30 or 5W-40 CJ-4 diesel oil via the filler cap on the valve cover. Confirm level on dipstick reads MAX.',
        torqueSpec: '40 Nm',
      },
      {
        order: 5,
        title: 'Run engine and check for leaks',
        rawText:
          'Start engine and idle for 2 minutes. Check drain plug and filter for any seeping. Shut off, wait 1 minute, recheck dipstick. Top up if level is below MAX.',
      },
    ],
  },

  // ── Toyota Camry — oil change ────────────────────────────────────────────────
  'camry::oil_change': {
    component: 'Engine oil & filter (2AR-FE 2.5)',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '30-45 min',
    tools: ['14mm socket (drain plug)', 'Oil filter wrench (64mm)', 'Drain pan (5L)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Use 0W-20 fully synthetic only — the 2AR-FE is designed for low-viscosity oil',
      'The drain plug uses a copper crush washer — replace with each oil change',
    ],
    sourceProvider: 'ToyoDIY',
    sourceReferences: [
      {
        title: 'Toyota Camry XV50 2.5 Oil Change (2AR-FE) — ToyoDIY',
        url: 'https://www.toyodiy.com/camry-2ar-fe-oil-change',
        excerpt:
          'Drain plug torque 27 Nm. The 2AR-FE 2.5 petrol takes 4.7 litres of 0W-20 fully synthetic. The spin-on filter is accessed from under the car on the driver side front of the engine.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and position drain pan',
        rawText: 'Run engine 5 minutes. Wait 10 minutes. Raise front of vehicle. Place drain pan under drain plug.',
      },
      {
        order: 2,
        title: 'Drain oil and replace filter',
        rawText:
          'Remove 14mm drain plug (torque 27 Nm on refitting with new washer). Remove spin-on filter with wrench, lubricate new filter gasket with oil, install hand-tight.',
        torqueSpec: '27 Nm',
      },
      {
        order: 3,
        title: 'Fill with fresh oil and verify level',
        rawText:
          'Fill with 4.7 litres of 0W-20 fully synthetic. Start engine, check for leaks, verify dipstick at MAX.',
      },
    ],
  },

  // ── Toyota Corolla — brake fluid flush ──────────────────────────────────────
  'corolla::brake_fluid_flush': {
    component: 'Brake fluid system',
    taskType: 'brake_fluid_flush',
    difficulty: 'Intermediate',
    timeEstimate: '45-60 min',
    tools: ['10mm ring spanner (bleed nipples)', 'Clear bleed hose and jar', 'DOT 3 brake fluid (1 litre)', 'Syringe for reservoir'],
    safetyNotes: [
      'Toyota Corolla uses DOT 3 — confirm before purchasing fluid',
      'Keep reservoir above MIN at all times during bleeding',
      'Brake fluid damages paint — cover bodywork',
    ],
    sourceProvider: 'ToyoDIY',
    sourceReferences: [
      {
        title: 'Toyota Corolla Brake Fluid Flush — ToyoDIY',
        url: 'https://www.toyodiy.com/corolla-brake-fluid-flush',
        excerpt:
          'Bleed sequence: RR → RL → FR → FL. Nipples are 10mm. Full flush uses approximately 500ml of DOT 3. Fluid should be replaced every 2 years regardless of appearance as DOT 3 absorbs moisture over time.',
      },
    ],
    steps: [
      { order: 1, title: 'Remove old fluid from reservoir', rawText: 'Syringe out old fluid from master cylinder reservoir. Fill to MAX with fresh DOT 3.' },
      { order: 2, title: 'Bleed rear-right first', rawText: 'Attach clear hose to rear-right nipple. Pump pedal 3 times and hold. Open nipple. Close before pedal releases. Repeat until fluid runs clear with no bubbles. Keep reservoir topped above MIN.' },
      { order: 3, title: 'Continue sequence RL → FR → FL', rawText: 'Repeat bleeding procedure at rear-left, front-right, front-left in that order. Top up reservoir after each corner.' },
      { order: 4, title: 'Verify firm pedal', rawText: 'After completing all four corners, pump pedal firmly 5 times. Pedal should feel hard and consistent. Top up reservoir to MAX.' },
    ],
  },
};

export class ToyotaAdapter implements SourceAdapter {
  readonly make = 'toyota';

  supportsModel(model: string): boolean {
    return SUPPORTED_MODELS.some((m) => model.toLowerCase().includes(m));
  }

  getPackage(model: string, year: number, taskType: TaskType): SourcePackage | null {
    const modelKey = SUPPORTED_MODELS.find((m) => model.toLowerCase().includes(m));
    if (!modelKey) return null;

    const key: SeedKey = `${modelKey}::${taskType}`;
    const seed = SEED[key];
    if (!seed) return null;

    return { ...seed, make: 'Toyota', model: model.trim(), year };
  }
}

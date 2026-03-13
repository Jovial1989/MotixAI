import { SourceAdapter } from './source-adapter.interface';
import { SourcePackage, TaskType } from './source-package.types';

const SUPPORTED_MODELS = ['micra', 'navara', 'qashqai', 'juke'];

type SeedKey = `${string}::${TaskType}`;

const SEED: Partial<Record<SeedKey, Omit<SourcePackage, 'make' | 'model' | 'year'>>> = {

  // ── Nissan Micra — oil change ───────────────────────────────────────────────
  'micra::oil_change': {
    component: 'Engine oil & filter',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '30-45 min',
    tools: ['14mm socket', 'Oil filter wrench', 'Drain pan (3L)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Ensure engine is warm but not hot before draining',
      'Use wheel chocks and engage parking brake if raising the vehicle',
      'Dispose of used oil at a certified recycling centre',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Micra K12 Oil Change DIY — NICOclub',
        url: 'https://www.nicoclub.com/nissan-micra-oil-change',
        excerpt:
          'Drain the 14mm drain plug, torque to 25 Nm on reinstall. The Micra K12 1.2 HR12DE engine takes 2.7 litres of 5W-30 fully synthetic. The spin-on oil filter is accessible from the top on the passenger side of the engine bay.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and prepare workspace',
        rawText:
          'Run the engine for 5 minutes to warm the oil to operating temperature — warm oil flows and drains much faster than cold oil. Shut engine off and wait 10 minutes so the block cools slightly before you touch anything. Place a drain pan (3L minimum) under the sump.',
        warningNote: 'Do not drain immediately after a long drive — scalding oil will spray under pressure.',
      },
      {
        order: 2,
        title: 'Remove drain plug and drain old oil',
        rawText:
          'Locate the 14mm drain plug on the bottom of the sump. Using a 14mm socket on a ratchet, turn anticlockwise to loosen. Finish removing by hand and allow oil to drain for 5–8 minutes. Inspect the sealing washer — replace if damaged or if you reuse the same plug more than 3 times.',
        torqueSpec: '25 Nm',
      },
      {
        order: 3,
        title: 'Remove and replace oil filter',
        rawText:
          'The spin-on filter sits near the top of the engine on the passenger side. Use an oil filter wrench to break it loose, then unscrew by hand. Before fitting the new filter, apply a thin smear of fresh engine oil to the new rubber gasket. Screw on hand-tight only — do not use a wrench to tighten.',
        warningNote: 'A dry gasket can cause the filter to seize or leak under pressure.',
      },
      {
        order: 4,
        title: 'Reinstall drain plug and fill with fresh oil',
        rawText:
          'Thread the drain plug back in by hand to avoid cross-threading. Torque to 25 Nm using a torque wrench. Open the oil filler cap on top of the engine and pour in 2.7 litres of 5W-30 fully synthetic engine oil using a funnel. The spec for HR12DE is 5W-30 API SN or newer.',
        torqueSpec: '25 Nm',
      },
      {
        order: 5,
        title: 'Check for leaks and verify level',
        rawText:
          'Start the engine and let it idle for 2 minutes. Inspect the drain plug and filter for any seeping oil. Shut off engine and wait 1 minute, then pull the dipstick, wipe it clean, reinsert fully, and pull again. Oil level should read between the MIN and MAX marks. Top up if required.',
      },
    ],
  },

  // ── Nissan Micra — brake pad replacement ────────────────────────────────────
  'micra::brake_pad_replacement': {
    component: 'Front brake pads',
    taskType: 'brake_pad_replacement',
    difficulty: 'Beginner',
    timeEstimate: '60-90 min',
    tools: [
      '21mm socket (wheel nuts)',
      '12mm socket (caliper slide pin bolts)',
      'C-clamp or caliper piston tool',
      'Wire brush',
      'Copper grease / anti-seize',
      'Torque wrench',
      'Jack and axle stands',
    ],
    safetyNotes: [
      'Never work under a vehicle supported only by a hydraulic jack — use axle stands',
      'Do not open the brake fluid reservoir cap while compressing the caliper piston',
      'Pump the brake pedal 5–10 times before moving the vehicle to seat the new pads',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Micra K12 Front Brake Pad Replacement — NICOclub',
        url: 'https://www.nicoclub.com/nissan-micra-brake-pads',
        excerpt:
          'Front caliper uses a 12mm slide pin bolt. Compress the piston straight in using a C-clamp or piston wind-back tool before installing new pads. Bed in brakes with 5 gentle stops from 50 km/h to cure the pad material.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Loosen wheel nuts and raise vehicle',
        rawText:
          'With the vehicle on level ground, loosen the four wheel nuts half a turn before jacking up. Raise the front of the car and support securely on axle stands placed under the reinforced jacking points in the sills. Remove the wheel completely.',
        warningNote: 'Place wheel chocks on the rear wheels before raising the front.',
      },
      {
        order: 2,
        title: 'Inspect pad thickness and remove caliper',
        rawText:
          'Look through the caliper window — if pad friction material is less than 3mm, replacement is due. Using a 12mm socket, remove the two slide pin bolts at the rear of the caliper. Slide the caliper off the disc and hang it from the spring or a piece of wire — never let it hang by the brake hose.',
      },
      {
        order: 3,
        title: 'Remove old brake pads and clean bracket',
        rawText:
          'Pull the old brake pads out of the carrier bracket. Use a wire brush to clean the pad abutment surfaces on the bracket — remove all rust and debris. Apply a thin smear of copper grease to the abutment surfaces only. Do not get copper grease on the disc or pad friction surfaces.',
      },
      {
        order: 4,
        title: 'Compress caliper piston',
        rawText:
          'The Micra K12 front caliper piston winds straight back (no rotation needed). Place a C-clamp with the screw on the piston face and the frame against the back of the caliper, then slowly compress the piston fully into the caliper bore. Watch the fluid reservoir — if it overflows, remove some fluid with a syringe first.',
        warningNote: 'Brake fluid damages paint — protect surrounding bodywork with a rag.',
      },
      {
        order: 5,
        title: 'Fit new pads and anti-squeal shims',
        rawText:
          'Fit the new inner pad (the one with the wear indicator clip) against the piston face, and the outer pad against the caliper bridge. If new shims are supplied, fit them behind each pad. Confirm the pads slide freely in the bracket without binding.',
      },
      {
        order: 6,
        title: 'Refit caliper and wheel',
        rawText:
          'Slide the caliper back over the pads and disc. Thread the two 12mm slide pin bolts in by hand, then torque to 35 Nm. Refit the wheel and torque wheel nuts to 98 Nm in a star pattern.',
        torqueSpec: 'Slide pin bolts: 35 Nm | Wheel nuts: 98 Nm',
      },
      {
        order: 7,
        title: 'Bed in new brake pads',
        rawText:
          'Before driving on public roads, pump the brake pedal 10 times to push the piston back against the new pads. Drive at low speed and perform 5 gentle stops from 50 km/h, allowing 1 minute cooling between each. Avoid hard braking for the first 200 km.',
      },
    ],
  },

  // ── Nissan Navara D40 — oil change ──────────────────────────────────────────
  'navara::oil_change': {
    component: 'Engine oil & filter (YD25DDTi diesel)',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '45-60 min',
    tools: ['17mm socket (drain plug)', 'Oil filter wrench (76mm)', 'Drain pan (8L min)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Diesel engine oil contains combustion byproducts — wear nitrile gloves',
      'The 2.5D takes 8 litres — ensure drain pan is large enough',
      'Use rated axle stands for underbody access, not a scissor jack alone',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Navara D40 YD25DDTi Oil Service — NICOclub',
        url: 'https://www.nicoclub.com/nissan-navara-d40-oil-change',
        excerpt:
          'The YD25DDTi 2.5 turbodiesel drain plug is 17mm and torques to 34 Nm. Capacity is 7.5–8 litres with filter. Use 5W-30 or 5W-40 meeting API CF-4 or ACEA B3. The spin-on filter sits on the driver side of the block and is accessible from underneath.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and position drain pan',
        rawText:
          'Run the engine for 5 minutes. Shut off and wait 10 minutes to cool slightly. Raise the front of the vehicle and support on rated axle stands. Position an 8-litre drain pan directly under the sump drain plug on the driver side of the engine.',
      },
      {
        order: 2,
        title: 'Remove drain plug and drain oil',
        rawText:
          'Using a 17mm socket, loosen the drain plug anticlockwise. Remove by hand and allow oil to drain for 5–8 minutes. Replace the copper sealing washer if damaged.',
        torqueSpec: '34 Nm',
      },
      {
        order: 3,
        title: 'Replace spin-on oil filter',
        rawText:
          'The filter is a 76mm spin-on type on the driver side of the block. Use an oil filter wrench to break it loose, then unscrew by hand. Wipe the mating surface with a clean rag. Apply fresh oil to the new filter gasket, then thread on hand-tight.',
      },
      {
        order: 4,
        title: 'Reinstall drain plug and refill',
        rawText:
          'Thread the drain plug by hand, then torque to 34 Nm. Fill with 7.5 litres of 5W-30 or 5W-40 API CF-4 diesel oil via the filler cap on top of the engine. Check dipstick and add up to 0.5L more to reach MAX.',
        torqueSpec: '34 Nm',
      },
      {
        order: 5,
        title: 'Run engine and inspect',
        rawText:
          'Start engine and idle for 2 minutes. Check drain plug and filter for leaks. Shut off, wait 1 minute, and verify dipstick reads between MIN and MAX.',
      },
    ],
  },

  // ── Nissan Qashqai — brake fluid flush ──────────────────────────────────────
  'qashqai::brake_fluid_flush': {
    component: 'Brake fluid system',
    taskType: 'brake_fluid_flush',
    difficulty: 'Intermediate',
    timeEstimate: '45-60 min',
    tools: ['Brake bleeder kit or vacuum bleeder', 'Clear hose and jar', '10mm ring spanner (bleed nipples)', 'DOT 4 brake fluid (1 litre)', 'Helper for pedal pumping'],
    safetyNotes: [
      'DOT 4 fluid is hygroscopic — use sealed bottles only',
      'Brake fluid damages paint — protect surrounding bodywork',
      'Never let the master cylinder reservoir run dry during bleeding',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Qashqai J10/J11 Brake Fluid Flush Guide — NICOclub',
        url: 'https://www.nicoclub.com/nissan-qashqai-brake-fluid-flush',
        excerpt:
          'Bleed sequence on the Qashqai is rear-right, rear-left, front-right, front-left. Each nipple is 10mm. Flush until clear fluid emerges with no air bubbles. Full system takes approximately 500ml of DOT 4.',
      },
    ],
    steps: [
      { order: 1, title: 'Suck out old fluid from reservoir', rawText: 'Using a syringe or turkey baster, remove as much old fluid from the master cylinder reservoir as possible. Refill to MAX with fresh DOT 4.' },
      { order: 2, title: 'Bleed rear-right caliper first', rawText: 'Attach a clear hose to the rear-right bleed nipple and submerge the free end in a jar with a little fresh DOT 4. Ask a helper to pump the pedal 3 times and hold. Open the 10mm nipple a quarter turn — fluid and air will purge. Close nipple before helper releases pedal. Repeat until clear fluid with no bubbles.' },
      { order: 3, title: 'Bleed remaining calipers in sequence', rawText: 'Repeat the pump-hold-open-close procedure at rear-left, then front-right, then front-left. Keep reservoir topped up above MIN throughout. Sequence: RR → RL → FR → FL.' },
      { order: 4, title: 'Top up reservoir and check pedal feel', rawText: 'Refill reservoir to MAX line. Pump pedal to check for a firm, consistent feel with no sponginess. A spongy pedal indicates remaining air — repeat the bleeding sequence.' },
    ],
  },
};

export class NissanAdapter implements SourceAdapter {
  readonly make = 'nissan';

  supportsModel(model: string): boolean {
    return SUPPORTED_MODELS.some((m) => model.toLowerCase().includes(m));
  }

  getPackage(model: string, year: number, taskType: TaskType): SourcePackage | null {
    const modelKey = SUPPORTED_MODELS.find((m) => model.toLowerCase().includes(m));
    if (!modelKey) return null;

    const key: SeedKey = `${modelKey}::${taskType}`;
    const seed = SEED[key];
    if (!seed) return null;

    return { ...seed, make: 'Nissan', model: model.trim(), year };
  }
}

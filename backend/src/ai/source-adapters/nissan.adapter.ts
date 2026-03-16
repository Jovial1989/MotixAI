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

  // ── Nissan Micra — brake fluid flush ────────────────────────────────────────
  'micra::brake_fluid_flush': {
    component: 'Brake fluid system',
    taskType: 'brake_fluid_flush',
    difficulty: 'Beginner',
    timeEstimate: '45-60 min',
    tools: ['10mm ring spanner (bleed nipples)', 'Clear bleed hose and jar', 'DOT 3 brake fluid (500ml)', 'Syringe for reservoir'],
    safetyNotes: [
      'Nissan Micra K12 uses DOT 3 — do not substitute DOT 5 silicone fluid',
      'Never let the master cylinder reservoir run dry — air in lines requires full re-bleed',
      'Brake fluid is corrosive and will strip paint — cover surrounding bodywork',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Micra K12 Brake Fluid Flush — NICOclub',
        url: 'https://www.nicoclub.com/nissan-micra-brake-fluid-flush',
        excerpt:
          'The Micra K12 bleed sequence is rear-right, rear-left, front-right, front-left. All nipples are 10mm. The reservoir holds approximately 250ml; a full system flush uses around 400-500ml of DOT 3. Replace fluid every 2 years as DOT 3 is hygroscopic.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Remove old fluid from master cylinder reservoir',
        rawText: 'Open the bonnet and locate the brake fluid reservoir on the driver side firewall. Using a syringe or turkey baster, remove as much of the old fluid as possible. Refill to the MAX mark with fresh DOT 3 brake fluid.',
      },
      {
        order: 2,
        title: 'Bleed rear-right caliper first',
        rawText: 'Start at the rear-right caliper — the wheel furthest from the master cylinder. Attach a length of clear plastic hose to the 10mm bleed nipple and submerge the free end in a small jar containing a little fresh DOT 3. Ask a helper to pump the brake pedal 3 times and hold it down. Open the nipple a quarter turn — fluid and any air bubbles will purge into the jar. Close the nipple firmly before your helper releases the pedal. Repeat until only clear, clean fluid with no bubbles exits.',
        warningNote: 'Always close the nipple BEFORE the helper releases the pedal — releasing with the nipple open draws air back in.',
      },
      {
        order: 3,
        title: 'Bleed rear-left caliper',
        rawText: 'Move to the rear-left caliper. Repeat the pump-hold-open-close sequence until clean fluid flows. Keep monitoring the reservoir and top it up above MIN — never let it empty.',
      },
      {
        order: 4,
        title: 'Bleed front-right caliper',
        rawText: 'Move to the front-right caliper. Repeat the same bleed procedure. The front calipers are closer to the reservoir so they will clear faster.',
      },
      {
        order: 5,
        title: 'Bleed front-left caliper and verify pedal',
        rawText: 'Complete the sequence at the front-left caliper. After bleeding all four corners, top up the reservoir to MAX and refit the cap. Pump the brake pedal firmly 5 times — it should feel hard and consistent with no sponginess. A spongy pedal indicates remaining air; repeat the full sequence.',
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

  // ── Nissan Navara D40 — brake pad replacement ────────────────────────────────
  'navara::brake_pad_replacement': {
    component: 'Front brake pads',
    taskType: 'brake_pad_replacement',
    difficulty: 'Intermediate',
    timeEstimate: '60-90 min',
    tools: [
      '21mm socket (wheel nuts)',
      '14mm socket (caliper slide pin bolts)',
      'C-clamp or caliper piston press',
      'Wire brush',
      'Copper grease / anti-seize',
      'Brake cleaner spray',
      'Torque wrench',
      'Jack and rated axle stands',
    ],
    safetyNotes: [
      'The Navara D40 is a heavy vehicle — use heavy-duty rated axle stands, not the factory scissor jack alone',
      'Do not open the brake fluid reservoir cap while compressing the caliper piston',
      'Pump the brake pedal 10 times before moving the vehicle after fitting new pads',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Navara D40 Front Brake Pad Replacement — NICOclub',
        url: 'https://www.nicoclub.com/nissan-navara-d40-brake-pads',
        excerpt:
          'The D40 Navara front caliper uses two 14mm slide pin bolts torqued to 30 Nm. The single-piston slides straight back using a C-clamp. Wheel nuts torque to 118 Nm. Bed in new pads with 5 progressive stops from 60 km/h before hard braking.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Loosen wheel nuts and raise the vehicle',
        rawText: 'With the Navara on level ground, loosen the five wheel nuts half a turn using a 21mm socket while the wheel is still on the ground. Position the jack under the factory jacking point and raise the vehicle. Support on rated axle stands positioned under the chassis rails — the D40 is significantly heavier than a passenger car. Remove the wheel.',
        warningNote: 'The D40 Navara weighs approximately 1,800 kg — only use axle stands rated for the load.',
      },
      {
        order: 2,
        title: 'Inspect pads and remove caliper slide pin bolts',
        rawText: 'Look through the caliper inspection window — if friction material is under 3mm, replacement is due. Using a 14mm socket, remove the two slide pin bolts from the back of the caliper. Slide the caliper off the disc and suspend it with a wire hook from the coil spring or chassis — do not let it hang on the brake hose.',
      },
      {
        order: 3,
        title: 'Remove old pads and clean the bracket',
        rawText: 'Slide the old inner and outer brake pads out of the caliper carrier bracket. Using a wire brush and brake cleaner spray, clean all four pad abutment surfaces on the bracket until bare metal is exposed. Apply a thin smear of copper grease to the abutment lands only — keep it off the disc face and pad friction material.',
      },
      {
        order: 4,
        title: 'Compress the caliper piston',
        rawText: 'The D40 Navara front caliper piston pushes straight back — no rotation is needed. Place a C-clamp with the screw bearing against the piston face and the frame bearing against the back of the caliper housing. Slowly wind the clamp in to push the piston fully into the bore. Monitor the brake fluid reservoir in the engine bay — if fluid rises to the brim, remove some with a syringe before continuing.',
        warningNote: 'Brake fluid will damage paintwork — place a rag over the reservoir and surrounding panel.',
      },
      {
        order: 5,
        title: 'Fit new brake pads',
        rawText: 'Slide the new inner pad (with the wear indicator clip) into the caliper bracket against the piston. Fit the new outer pad on the opposite side. If anti-squeal shims are supplied, attach them to the back face of each pad. Confirm both pads move freely in the bracket without binding.',
      },
      {
        order: 6,
        title: 'Refit caliper and torque bolts',
        rawText: 'Carefully slide the caliper back over the pads and onto the disc. Thread both 14mm slide pin bolts in by hand, then torque to 30 Nm. Refit the wheel and thread the five wheel nuts by hand. Lower the vehicle and torque wheel nuts to 118 Nm in a star pattern.',
        torqueSpec: 'Slide pin bolts: 30 Nm | Wheel nuts: 118 Nm',
      },
      {
        order: 7,
        title: 'Pump pedal and perform pad bed-in',
        rawText: 'Before driving, sit in the cab and pump the brake pedal firmly 10 times until it feels hard and normal height. Perform 5 progressive stops from 60 km/h to 5 km/h to bed in the new pad material, with a 1-minute cooling interval between each stop. Avoid heavy braking for the first 200 km.',
      },
    ],
  },

  // ── Nissan Navara D40 — brake fluid flush ────────────────────────────────────
  'navara::brake_fluid_flush': {
    component: 'Brake fluid system',
    taskType: 'brake_fluid_flush',
    difficulty: 'Intermediate',
    timeEstimate: '45-60 min',
    tools: ['10mm ring spanner (bleed nipples)', 'Clear bleed hose and collection jar', 'DOT 3 brake fluid (1 litre)', 'Syringe for reservoir', 'Helper for pedal pumping'],
    safetyNotes: [
      'Nissan Navara D40 specifies DOT 3 brake fluid — do not mix with DOT 5 silicone',
      'Never allow the master cylinder reservoir to run dry during bleeding',
      'Brake fluid is corrosive — protect bodywork and your skin',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Navara D40 Brake Fluid Flush — NICOclub',
        url: 'https://www.nicoclub.com/nissan-navara-d40-brake-fluid-flush',
        excerpt:
          'The D40 Navara bleed sequence is rear-right, rear-left, front-right, front-left. All bleed nipples are 10mm. Budget for 800ml–1 litre of DOT 3 for a full flush. Nissan recommends brake fluid replacement every 2 years on the D40.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Remove old fluid from master cylinder reservoir',
        rawText: 'Open the bonnet. The brake master cylinder reservoir is on the driver side firewall. Using a syringe, remove as much old fluid as possible. Refill to MAX with fresh DOT 3 brake fluid.',
      },
      {
        order: 2,
        title: 'Bleed rear-right caliper',
        rawText: 'Raise the vehicle or access the rear-right caliper from underneath. Locate the 10mm bleed nipple on the caliper body. Attach a clear hose to the nipple and submerge the other end in a jar with a small amount of DOT 3. Have a helper pump the pedal 3 times and hold. Open the nipple a quarter turn — fluid and air will purge. Close the nipple before the helper releases. Repeat until no bubbles appear and fluid runs clear. Top up reservoir.',
        warningNote: 'Close the nipple BEFORE the helper releases the pedal to prevent air being drawn back in.',
      },
      {
        order: 3,
        title: 'Bleed rear-left caliper',
        rawText: 'Move to the rear-left caliper. Repeat the same pump-hold-open-close sequence until only clean fluid with no air bubbles exits. Keep the reservoir above MIN throughout.',
      },
      {
        order: 4,
        title: 'Bleed front-right caliper',
        rawText: 'Move to the front-right caliper. Repeat the bleed procedure. Front calipers typically clear more quickly as they are closer to the master cylinder.',
      },
      {
        order: 5,
        title: 'Bleed front-left and verify pedal',
        rawText: 'Complete bleeding at the front-left caliper. Top up reservoir to MAX and refit the cap. Pump the brake pedal firmly 5 times and confirm a solid, consistent feel with no sponginess. A spongy pedal indicates remaining air — repeat the full sequence from the rear-right.',
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

  // ── Nissan Qashqai J10/J11 — oil change ─────────────────────────────────────
  'qashqai::oil_change': {
    component: 'Engine oil & filter (HR16DE 1.6)',
    taskType: 'oil_change',
    difficulty: 'Beginner',
    timeEstimate: '30-45 min',
    tools: ['14mm socket (drain plug)', 'Oil filter wrench (65mm)', 'Drain pan (4L)', 'Funnel', 'Torque wrench'],
    safetyNotes: [
      'Use 5W-30 fully synthetic or semi-synthetic meeting dexos2 or ACEA A3/B4 specification',
      'The HR16DE drain plug uses a copper crush washer — replace with each service',
      'Do not run engine dry — confirm oil is at MAX before starting',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Qashqai J10 HR16DE Oil Change — NICOclub',
        url: 'https://www.nicoclub.com/nissan-qashqai-j10-oil-change',
        excerpt:
          'The Qashqai J10 HR16DE 1.6 takes 3.6 litres of 5W-30 with filter change. Drain plug is 14mm, torque to 25 Nm with a new copper washer. The spin-on filter is accessible from the top of the engine bay on the passenger side.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Warm engine and prepare drain pan',
        rawText: 'Run the engine for 5 minutes to warm the oil, then shut off and wait 10 minutes. The drain plug is on the underside of the sump — position a drain pan with at least 4L capacity directly beneath it.',
      },
      {
        order: 2,
        title: 'Remove drain plug and drain oil',
        rawText: 'Using a 14mm socket, loosen the drain plug anticlockwise, then remove by hand. Allow the oil to drain fully for 5–8 minutes. Inspect the copper sealing washer — replace it if flattened or grooved.',
        torqueSpec: '25 Nm',
      },
      {
        order: 3,
        title: 'Remove and replace oil filter',
        rawText: 'The HR16DE spin-on filter sits on the passenger side of the engine bay. Use a 65mm oil filter wrench to break it loose, then unscrew by hand. Wipe the filter mounting face clean. Apply a thin film of fresh oil to the new filter gasket, then screw the new filter on hand-tight.',
      },
      {
        order: 4,
        title: 'Reinstall drain plug and refill engine oil',
        rawText: 'Thread the drain plug with a new copper washer and torque to 25 Nm. Open the oil filler cap (marked with an oil can symbol) and pour in 3.6 litres of 5W-30 using a funnel. Check the dipstick — level should sit at MAX. Install the filler cap.',
        torqueSpec: '25 Nm',
      },
      {
        order: 5,
        title: 'Run engine and verify level',
        rawText: 'Start the engine and idle for 2 minutes. Check the drain plug and filter for any seeping oil. Shut off, wait 1 minute, then pull the dipstick and verify the level is between MIN and MAX. Top up if required.',
      },
    ],
  },

  // ── Nissan Qashqai J10/J11 — brake pad replacement ──────────────────────────
  'qashqai::brake_pad_replacement': {
    component: 'Front brake pads',
    taskType: 'brake_pad_replacement',
    difficulty: 'Beginner',
    timeEstimate: '60-90 min',
    tools: [
      '21mm socket (wheel nuts)',
      '12mm socket (caliper slide pin bolts)',
      'C-clamp or brake caliper piston press',
      'Wire brush',
      'Copper grease',
      'Brake cleaner spray',
      'Torque wrench',
      'Jack and axle stands',
    ],
    safetyNotes: [
      'Always support the Qashqai on axle stands — never rely on the hydraulic jack alone',
      'Keep the brake fluid reservoir cap in place while pushing the caliper piston back',
      'Pump the brake pedal fully before the first drive to seat new pads against the disc',
    ],
    sourceProvider: 'NICOclub',
    sourceReferences: [
      {
        title: 'Nissan Qashqai J10 Front Brake Pad Replacement — NICOclub',
        url: 'https://www.nicoclub.com/nissan-qashqai-j10-brake-pads',
        excerpt:
          'The J10 Qashqai front caliper uses two 12mm slide pin bolts torqued to 30 Nm. The single piston pushes straight back with a C-clamp. Wheel nuts torque to 108 Nm. Ensure new pads are bedded in over 5 progressive stops before emergency braking.',
      },
    ],
    steps: [
      {
        order: 1,
        title: 'Loosen wheel nuts and raise vehicle',
        rawText: 'On flat ground, loosen the five wheel nuts half a turn with a 21mm socket while the tyre is still loaded. Jack up the front of the vehicle and support on axle stands positioned under the reinforced sill jacking points. Remove the wheel.',
        warningNote: 'Position wheel chocks on the rear wheels before raising the front axle.',
      },
      {
        order: 2,
        title: 'Remove caliper slide pin bolts',
        rawText: 'The two 12mm slide pin bolts are on the rear face of the caliper. Remove both. Slide the caliper forward off the disc. Hang it from the coil spring with a length of wire or a hook — do not leave it hanging from the brake hose.',
      },
      {
        order: 3,
        title: 'Remove old pads and clean bracket abutments',
        rawText: 'Pull the inner and outer brake pads out of the carrier bracket. Spray the abutment channels with brake cleaner and scrub with a wire brush until clean bare metal is visible. Apply a light smear of copper grease to the abutment surfaces only — no grease on friction material or disc.',
      },
      {
        order: 4,
        title: 'Compress the caliper piston',
        rawText: 'The Qashqai J10 front caliper piston is a straight push-in type. Use a C-clamp with the screw on the piston face and the frame bearing against the back of the caliper body. Slowly compress the piston until it sits flush. If brake fluid level in the reservoir rises to the brim, use a syringe to remove some before proceeding.',
      },
      {
        order: 5,
        title: 'Fit new brake pads',
        rawText: 'Insert the new inner pad (with wear indicator clip) against the piston, and the outer pad against the caliper bridge. If anti-squeal shims are provided, fit them behind each pad. Confirm both pads slide freely in the bracket without sticking.',
      },
      {
        order: 6,
        title: 'Refit caliper and wheel',
        rawText: 'Slide the caliper back over the pads and disc. Start the 12mm slide pin bolts by hand, then torque to 30 Nm. Refit the wheel, start wheel nuts by hand, lower vehicle, then torque to 108 Nm in a star pattern.',
        torqueSpec: 'Slide pin bolts: 30 Nm | Wheel nuts: 108 Nm',
      },
      {
        order: 7,
        title: 'Seat pads and check brake pedal',
        rawText: 'Pump the brake pedal firmly 10 times to push the piston out against the new pads. The first few pumps will feel soft — this is normal. Perform 5 progressive braking events from 50 km/h to bed in the pads before hard braking.',
      },
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

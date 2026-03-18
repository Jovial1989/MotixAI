import type { SourcePackage, TaskType } from "./types.ts";

/**
 * Models with actual seeded NICOclub data.
 * "juke" intentionally excluded — no seed data exists for it.
 */
const SUPPORTED_MODELS = ["micra", "navara", "qashqai"];

/**
 * Year ranges corresponding to the specific generation covered by NICOclub seed data.
 * Requests outside these ranges return null → falls back to AI Generated.
 *   Micra K12 (HR12DE):   2002–2010
 *   Navara D40 (YD25DDTi): 2005–2015
 *   Qashqai J10 (HR16DE):  2007–2013
 */
const MODEL_YEAR_RANGES: Record<string, [number, number]> = {
  micra:   [2002, 2010],
  navara:  [2005, 2015],
  qashqai: [2007, 2013],
};

type SeedKey = `${string}::${TaskType}`;

const SEED: Partial<Record<SeedKey, Omit<SourcePackage, "make" | "model" | "year">>> = {

  // ── Nissan Micra — oil change ─────────────────────────────────────────────
  "micra::oil_change": {
    component: "Engine oil & filter",
    taskType: "oil_change",
    difficulty: "Beginner",
    timeEstimate: "30-45 min",
    tools: ["14mm socket", "Oil filter wrench", "Drain pan (3L)", "Funnel", "Torque wrench"],
    safetyNotes: [
      "Ensure engine is warm but not hot before draining",
      "Use wheel chocks and engage parking brake if raising the vehicle",
      "Dispose of used oil at a certified recycling centre",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Micra K12 Oil Change DIY — NICOclub",
      url: "https://www.nicoclub.com/nissan-micra-oil-change",
      excerpt: "Drain the 14mm drain plug, torque to 25 Nm on reinstall. The Micra K12 1.2 HR12DE engine takes 2.7 litres of 5W-30 fully synthetic. The spin-on oil filter is accessible from the top on the passenger side of the engine bay.",
    }],
    steps: [
      { order: 1, title: "Warm engine and prepare workspace", rawText: "Run the engine for 5 minutes to warm the oil. Shut engine off and wait 10 minutes. Place a drain pan (3L minimum) under the sump.", warningNote: "Do not drain immediately after a long drive — scalding oil will spray under pressure." },
      { order: 2, title: "Remove drain plug and drain old oil", rawText: "Locate the 14mm drain plug on the bottom of the sump. Using a 14mm socket, turn anticlockwise to loosen. Remove by hand and allow oil to drain for 5–8 minutes. Inspect the sealing washer — replace if damaged.", torqueSpec: "25 Nm" },
      { order: 3, title: "Remove and replace oil filter", rawText: "The spin-on filter sits near the top of the engine on the passenger side. Use an oil filter wrench to break it loose. Apply a thin smear of fresh engine oil to the new rubber gasket. Screw on hand-tight only.", warningNote: "A dry gasket can cause the filter to seize or leak under pressure." },
      { order: 4, title: "Reinstall drain plug and fill with fresh oil", rawText: "Thread the drain plug back in by hand to avoid cross-threading. Torque to 25 Nm. Pour in 2.7 litres of 5W-30 fully synthetic engine oil using a funnel.", torqueSpec: "25 Nm" },
      { order: 5, title: "Check for leaks and verify level", rawText: "Start the engine and let it idle for 2 minutes. Inspect drain plug and filter for any seeping oil. Shut off, wait 1 minute, then pull the dipstick — level should read between MIN and MAX." },
    ],
  },

  // ── Nissan Micra — brake pad replacement ─────────────────────────────────
  "micra::brake_pad_replacement": {
    component: "Front brake pads",
    taskType: "brake_pad_replacement",
    difficulty: "Beginner",
    timeEstimate: "60-90 min",
    tools: ["21mm socket (wheel nuts)", "12mm socket (caliper slide pin bolts)", "C-clamp or caliper piston tool", "Wire brush", "Copper grease / anti-seize", "Torque wrench", "Jack and axle stands"],
    safetyNotes: [
      "Never work under a vehicle supported only by a hydraulic jack — use axle stands",
      "Do not open the brake fluid reservoir cap while compressing the caliper piston",
      "Pump the brake pedal 5–10 times before moving the vehicle to seat the new pads",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Micra K12 Front Brake Pad Replacement — NICOclub",
      url: "https://www.nicoclub.com/nissan-micra-brake-pads",
      excerpt: "Front caliper uses a 12mm slide pin bolt. Compress the piston straight in using a C-clamp. Bed in brakes with 5 gentle stops from 50 km/h.",
    }],
    steps: [
      { order: 1, title: "Loosen wheel nuts and raise vehicle", rawText: "Loosen the four wheel nuts half a turn before jacking up. Raise the front and support on axle stands at sill jacking points. Remove the wheel.", warningNote: "Place wheel chocks on the rear wheels before raising the front." },
      { order: 2, title: "Inspect pad thickness and remove caliper", rawText: "If pad friction material is less than 3mm, replacement is due. Remove the two 12mm slide pin bolts. Slide the caliper off and hang it from the spring — never let it hang by the brake hose." },
      { order: 3, title: "Remove old pads and clean bracket", rawText: "Pull the old pads out of the carrier bracket. Wire-brush the abutment surfaces. Apply a thin smear of copper grease to the abutment surfaces only — not on disc or pad friction faces." },
      { order: 4, title: "Compress caliper piston", rawText: "The Micra K12 front caliper piston winds straight back. Place a C-clamp on the piston face and compress fully into the bore.", warningNote: "Brake fluid damages paint — protect surrounding bodywork with a rag." },
      { order: 5, title: "Fit new pads and anti-squeal shims", rawText: "Fit the new inner pad (with the wear indicator clip) against the piston face, and the outer pad against the caliper bridge. Confirm the pads slide freely without binding." },
      { order: 6, title: "Refit caliper and wheel", rawText: "Slide the caliper back over the pads and disc. Torque the two 12mm slide pin bolts to 35 Nm. Refit the wheel and torque wheel nuts to 98 Nm in a star pattern.", torqueSpec: "Slide pin bolts: 35 Nm | Wheel nuts: 98 Nm" },
      { order: 7, title: "Bed in new brake pads", rawText: "Pump the brake pedal 10 times to push the piston against the new pads. Perform 5 gentle stops from 50 km/h, allowing 1 minute cooling between each. Avoid hard braking for the first 200 km." },
    ],
  },

  // ── Nissan Micra — brake fluid flush ─────────────────────────────────────
  "micra::brake_fluid_flush": {
    component: "Brake fluid system",
    taskType: "brake_fluid_flush",
    difficulty: "Beginner",
    timeEstimate: "45-60 min",
    tools: ["10mm ring spanner (bleed nipples)", "Clear bleed hose and jar", "DOT 3 brake fluid (500ml)", "Syringe for reservoir"],
    safetyNotes: [
      "Nissan Micra K12 uses DOT 3 — do not substitute DOT 5 silicone fluid",
      "Never let the master cylinder reservoir run dry — air in lines requires full re-bleed",
      "Brake fluid is corrosive and will strip paint — cover surrounding bodywork",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Micra K12 Brake Fluid Flush — NICOclub",
      url: "https://www.nicoclub.com/nissan-micra-brake-fluid-flush",
      excerpt: "The Micra K12 bleed sequence is rear-right, rear-left, front-right, front-left. All nipples are 10mm. A full system flush uses around 400-500ml of DOT 3.",
    }],
    steps: [
      { order: 1, title: "Remove old fluid from master cylinder reservoir", rawText: "Open the bonnet and locate the brake fluid reservoir on the driver side firewall. Using a syringe, remove as much of the old fluid as possible. Refill to the MAX mark with fresh DOT 3 brake fluid." },
      { order: 2, title: "Bleed rear-right caliper first", rawText: "Attach a clear hose to the 10mm bleed nipple submerged in a jar with fresh DOT 3. Have a helper pump the pedal 3 times and hold. Open the nipple a quarter turn — fluid and air will purge. Close nipple before helper releases pedal. Repeat until only clean fluid exits.", warningNote: "Always close the nipple BEFORE the helper releases the pedal." },
      { order: 3, title: "Bleed rear-left caliper", rawText: "Move to the rear-left caliper. Repeat the pump-hold-open-close sequence until clean fluid flows. Keep monitoring the reservoir and top it up above MIN." },
      { order: 4, title: "Bleed front-right caliper", rawText: "Move to the front-right caliper. Repeat the same bleed procedure." },
      { order: 5, title: "Bleed front-left caliper and verify pedal", rawText: "Complete the sequence at the front-left caliper. Top up the reservoir to MAX. Pump the brake pedal firmly 5 times — it should feel hard and consistent with no sponginess." },
    ],
  },

  // ── Nissan Navara D40 — oil change ────────────────────────────────────────
  "navara::oil_change": {
    component: "Engine oil & filter (YD25DDTi diesel)",
    taskType: "oil_change",
    difficulty: "Beginner",
    timeEstimate: "45-60 min",
    tools: ["17mm socket (drain plug)", "Oil filter wrench (76mm)", "Drain pan (8L min)", "Funnel", "Torque wrench"],
    safetyNotes: [
      "Diesel engine oil contains combustion byproducts — wear nitrile gloves",
      "The 2.5D takes 8 litres — ensure drain pan is large enough",
      "Use rated axle stands for underbody access",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Navara D40 YD25DDTi Oil Service — NICOclub",
      url: "https://www.nicoclub.com/nissan-navara-d40-oil-change",
      excerpt: "The YD25DDTi 2.5 turbodiesel drain plug is 17mm and torques to 34 Nm. Capacity is 7.5–8 litres with filter. Use 5W-30 or 5W-40 meeting API CF-4 or ACEA B3.",
    }],
    steps: [
      { order: 1, title: "Warm engine and position drain pan", rawText: "Run the engine for 5 minutes. Shut off and wait 10 minutes. Raise the front on axle stands. Position an 8-litre drain pan under the sump drain plug on the driver side." },
      { order: 2, title: "Remove drain plug and drain oil", rawText: "Using a 17mm socket, loosen the drain plug anticlockwise. Remove by hand and allow oil to drain for 5–8 minutes. Replace the copper sealing washer if damaged.", torqueSpec: "34 Nm" },
      { order: 3, title: "Replace spin-on oil filter", rawText: "The filter is a 76mm spin-on type on the driver side. Use an oil filter wrench to break it loose. Apply fresh oil to the new filter gasket, then thread on hand-tight." },
      { order: 4, title: "Reinstall drain plug and refill", rawText: "Thread the drain plug by hand, then torque to 34 Nm. Fill with 7.5 litres of 5W-30 or 5W-40 API CF-4 diesel oil. Check dipstick and add up to 0.5L more to reach MAX.", torqueSpec: "34 Nm" },
      { order: 5, title: "Run engine and inspect", rawText: "Start engine and idle for 2 minutes. Check drain plug and filter for leaks. Shut off, wait 1 minute, and verify dipstick reads between MIN and MAX." },
    ],
  },

  // ── Nissan Navara D40 — brake pad replacement ─────────────────────────────
  "navara::brake_pad_replacement": {
    component: "Front brake pads",
    taskType: "brake_pad_replacement",
    difficulty: "Intermediate",
    timeEstimate: "60-90 min",
    tools: ["21mm socket (wheel nuts)", "14mm socket (caliper slide pin bolts)", "C-clamp or caliper piston press", "Wire brush", "Copper grease / anti-seize", "Brake cleaner spray", "Torque wrench", "Jack and rated axle stands"],
    safetyNotes: [
      "The Navara D40 is a heavy vehicle — use heavy-duty rated axle stands",
      "Do not open the brake fluid reservoir cap while compressing the caliper piston",
      "Pump the brake pedal 10 times before moving the vehicle after fitting new pads",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Navara D40 Front Brake Pad Replacement — NICOclub",
      url: "https://www.nicoclub.com/nissan-navara-d40-brake-pads",
      excerpt: "The D40 Navara front caliper uses two 14mm slide pin bolts torqued to 30 Nm. Wheel nuts torque to 118 Nm. Bed in new pads with 5 progressive stops from 60 km/h.",
    }],
    steps: [
      { order: 1, title: "Loosen wheel nuts and raise the vehicle", rawText: "Loosen the five wheel nuts half a turn while on the ground. Jack up and support on rated axle stands under the chassis rails. Remove the wheel.", warningNote: "The D40 Navara weighs approximately 1,800 kg — only use axle stands rated for the load." },
      { order: 2, title: "Inspect pads and remove caliper slide pin bolts", rawText: "If friction material is under 3mm, replacement is due. Remove the two 14mm slide pin bolts. Slide the caliper off and suspend with a wire hook — do not hang it on the brake hose." },
      { order: 3, title: "Remove old pads and clean the bracket", rawText: "Slide the old pads out of the bracket. Wire-brush all four abutment surfaces until bare metal is exposed. Apply a thin smear of copper grease to the abutment lands only." },
      { order: 4, title: "Compress the caliper piston", rawText: "The D40 front piston pushes straight back. Use a C-clamp to slowly wind the piston fully into the bore. Monitor the brake fluid reservoir and remove excess fluid if it rises to the brim.", warningNote: "Brake fluid will damage paintwork — place a rag over the reservoir." },
      { order: 5, title: "Fit new brake pads", rawText: "Slide the new inner pad into the bracket against the piston. Fit the outer pad on the opposite side. Attach anti-squeal shims if supplied. Confirm both pads move freely." },
      { order: 6, title: "Refit caliper and torque bolts", rawText: "Slide the caliper back over the pads. Thread both 14mm slide pin bolts by hand, then torque to 30 Nm. Refit the wheel and torque wheel nuts to 118 Nm in a star pattern.", torqueSpec: "Slide pin bolts: 30 Nm | Wheel nuts: 118 Nm" },
      { order: 7, title: "Pump pedal and perform pad bed-in", rawText: "Pump the brake pedal firmly 10 times until it feels hard. Perform 5 progressive stops from 60 km/h to bed in the new pad material, with a 1-minute cooling interval between each." },
    ],
  },

  // ── Nissan Navara D40 — brake fluid flush ────────────────────────────────
  "navara::brake_fluid_flush": {
    component: "Brake fluid system",
    taskType: "brake_fluid_flush",
    difficulty: "Intermediate",
    timeEstimate: "45-60 min",
    tools: ["10mm ring spanner (bleed nipples)", "Clear bleed hose and collection jar", "DOT 3 brake fluid (1 litre)", "Syringe for reservoir"],
    safetyNotes: [
      "Nissan Navara D40 specifies DOT 3 brake fluid — do not mix with DOT 5 silicone",
      "Never allow the master cylinder reservoir to run dry during bleeding",
      "Brake fluid is corrosive — protect bodywork and your skin",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Navara D40 Brake Fluid Flush — NICOclub",
      url: "https://www.nicoclub.com/nissan-navara-d40-brake-fluid-flush",
      excerpt: "The D40 Navara bleed sequence is rear-right, rear-left, front-right, front-left. All bleed nipples are 10mm. Budget for 800ml–1 litre of DOT 3.",
    }],
    steps: [
      { order: 1, title: "Remove old fluid from master cylinder reservoir", rawText: "The brake master cylinder reservoir is on the driver side firewall. Using a syringe, remove as much old fluid as possible. Refill to MAX with fresh DOT 3 brake fluid." },
      { order: 2, title: "Bleed rear-right caliper", rawText: "Attach a clear hose to the 10mm bleed nipple submerged in a jar with DOT 3. Have a helper pump the pedal 3 times and hold. Open the nipple a quarter turn — fluid and air will purge. Close the nipple before the helper releases. Repeat until no bubbles.", warningNote: "Close the nipple BEFORE the helper releases the pedal to prevent air being drawn back in." },
      { order: 3, title: "Bleed rear-left caliper", rawText: "Move to the rear-left caliper. Repeat the pump-hold-open-close sequence until only clean fluid exits. Keep the reservoir above MIN throughout." },
      { order: 4, title: "Bleed front-right caliper", rawText: "Move to the front-right caliper. Repeat the bleed procedure." },
      { order: 5, title: "Bleed front-left and verify pedal", rawText: "Complete bleeding at the front-left caliper. Top up reservoir to MAX. Pump the brake pedal firmly 5 times and confirm a solid, consistent feel with no sponginess." },
    ],
  },

  // ── Nissan Qashqai — oil change ───────────────────────────────────────────
  "qashqai::oil_change": {
    component: "Engine oil & filter (HR16DE 1.6)",
    taskType: "oil_change",
    difficulty: "Beginner",
    timeEstimate: "30-45 min",
    tools: ["14mm socket (drain plug)", "Oil filter wrench (65mm)", "Drain pan (4L)", "Funnel", "Torque wrench"],
    safetyNotes: [
      "Use 5W-30 fully synthetic or semi-synthetic meeting dexos2 or ACEA A3/B4",
      "The HR16DE drain plug uses a copper crush washer — replace with each service",
      "Do not run engine dry — confirm oil is at MAX before starting",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Qashqai J10 HR16DE Oil Change — NICOclub",
      url: "https://www.nicoclub.com/nissan-qashqai-j10-oil-change",
      excerpt: "The Qashqai J10 HR16DE 1.6 takes 3.6 litres of 5W-30 with filter change. Drain plug is 14mm, torque to 25 Nm with a new copper washer.",
    }],
    steps: [
      { order: 1, title: "Warm engine and prepare drain pan", rawText: "Run the engine for 5 minutes, then shut off and wait 10 minutes. Position a drain pan with at least 4L capacity directly beneath the sump drain plug." },
      { order: 2, title: "Remove drain plug and drain oil", rawText: "Using a 14mm socket, loosen the drain plug anticlockwise. Remove by hand and allow oil to drain fully for 5–8 minutes. Inspect the copper sealing washer — replace if flattened.", torqueSpec: "25 Nm" },
      { order: 3, title: "Remove and replace oil filter", rawText: "The HR16DE spin-on filter sits on the passenger side. Use a 65mm oil filter wrench to break it loose. Apply a thin film of fresh oil to the new filter gasket, then screw on hand-tight." },
      { order: 4, title: "Reinstall drain plug and refill engine oil", rawText: "Thread the drain plug with a new copper washer and torque to 25 Nm. Pour in 3.6 litres of 5W-30 using a funnel. Check the dipstick — level should sit at MAX.", torqueSpec: "25 Nm" },
      { order: 5, title: "Run engine and verify level", rawText: "Start the engine and idle for 2 minutes. Check drain plug and filter for seeping oil. Shut off, wait 1 minute, then verify dipstick level is between MIN and MAX." },
    ],
  },

  // ── Nissan Qashqai — brake pad replacement ───────────────────────────────
  "qashqai::brake_pad_replacement": {
    component: "Front brake pads",
    taskType: "brake_pad_replacement",
    difficulty: "Beginner",
    timeEstimate: "60-90 min",
    tools: ["21mm socket (wheel nuts)", "12mm socket (caliper slide pin bolts)", "C-clamp or brake caliper piston press", "Wire brush", "Copper grease", "Brake cleaner spray", "Torque wrench", "Jack and axle stands"],
    safetyNotes: [
      "Always support the Qashqai on axle stands — never rely on the hydraulic jack alone",
      "Keep the brake fluid reservoir cap in place while pushing the caliper piston back",
      "Pump the brake pedal fully before the first drive to seat new pads against the disc",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Qashqai J10 Front Brake Pad Replacement — NICOclub",
      url: "https://www.nicoclub.com/nissan-qashqai-j10-brake-pads",
      excerpt: "The J10 Qashqai front caliper uses two 12mm slide pin bolts torqued to 30 Nm. Wheel nuts torque to 108 Nm.",
    }],
    steps: [
      { order: 1, title: "Loosen wheel nuts and raise vehicle", rawText: "Loosen the five wheel nuts half a turn while the tyre is still loaded. Jack up the front and support on axle stands. Remove the wheel.", warningNote: "Position wheel chocks on the rear wheels before raising the front axle." },
      { order: 2, title: "Remove caliper slide pin bolts", rawText: "Remove the two 12mm slide pin bolts at the rear face of the caliper. Slide the caliper forward off the disc. Hang it from the coil spring with wire — do not leave it hanging from the brake hose." },
      { order: 3, title: "Remove old pads and clean bracket abutments", rawText: "Pull the inner and outer pads out of the bracket. Spray abutment channels with brake cleaner and scrub with a wire brush until clean. Apply a light smear of copper grease to the abutment surfaces only." },
      { order: 4, title: "Compress the caliper piston", rawText: "The Qashqai J10 front piston is a straight push-in type. Use a C-clamp to compress the piston until it sits flush. If brake fluid rises to the brim, use a syringe to remove some." },
      { order: 5, title: "Fit new brake pads", rawText: "Insert the new inner pad against the piston, and the outer pad against the caliper bridge. Fit anti-squeal shims behind each pad if provided. Confirm both pads slide freely." },
      { order: 6, title: "Refit caliper and wheel", rawText: "Slide the caliper back over the pads and disc. Torque the 12mm slide pin bolts to 30 Nm. Refit the wheel, lower vehicle, then torque to 108 Nm in a star pattern.", torqueSpec: "Slide pin bolts: 30 Nm | Wheel nuts: 108 Nm" },
      { order: 7, title: "Seat pads and check brake pedal", rawText: "Pump the brake pedal firmly 10 times to push the piston against the new pads. Perform 5 progressive braking events from 50 km/h to bed in the pads before hard braking." },
    ],
  },

  // ── Nissan Qashqai — brake fluid flush ───────────────────────────────────
  "qashqai::brake_fluid_flush": {
    component: "Brake fluid system",
    taskType: "brake_fluid_flush",
    difficulty: "Intermediate",
    timeEstimate: "45-60 min",
    tools: ["10mm ring spanner (bleed nipples)", "Clear hose and jar", "DOT 4 brake fluid (1 litre)", "Helper for pedal pumping"],
    safetyNotes: [
      "DOT 4 fluid is hygroscopic — use sealed bottles only",
      "Brake fluid damages paint — protect surrounding bodywork",
      "Never let the master cylinder reservoir run dry during bleeding",
    ],
    sourceProvider: "NICOclub",
    sourceReferences: [{
      title: "Nissan Qashqai J10/J11 Brake Fluid Flush Guide — NICOclub",
      url: "https://www.nicoclub.com/nissan-qashqai-brake-fluid-flush",
      excerpt: "Bleed sequence on the Qashqai is rear-right, rear-left, front-right, front-left. Each nipple is 10mm. Full system takes approximately 500ml of DOT 4.",
    }],
    steps: [
      { order: 1, title: "Suck out old fluid from reservoir", rawText: "Using a syringe, remove as much old fluid from the master cylinder reservoir as possible. Refill to MAX with fresh DOT 4." },
      { order: 2, title: "Bleed rear-right caliper first", rawText: "Attach a clear hose to the rear-right bleed nipple submerged in a jar with a little fresh DOT 4. Have a helper pump the pedal 3 times and hold. Open the 10mm nipple a quarter turn — fluid and air purge. Close nipple before helper releases. Repeat until clear fluid with no bubbles." },
      { order: 3, title: "Bleed remaining calipers in sequence", rawText: "Repeat the pump-hold-open-close procedure at rear-left, then front-right, then front-left. Keep reservoir topped up above MIN throughout. Sequence: RR → RL → FR → FL." },
      { order: 4, title: "Top up reservoir and check pedal feel", rawText: "Refill reservoir to MAX line. Pump pedal to check for a firm, consistent feel with no sponginess. A spongy pedal indicates remaining air — repeat the bleeding sequence." },
    ],
  },
};

export function getNissanPackage(model: string, year: number, taskType: TaskType): SourcePackage | null {
  const modelKey = SUPPORTED_MODELS.find((m) => model.toLowerCase().includes(m));
  if (!modelKey) return null;

  // Enforce generation-specific year range — prevent applying K12/D40/J10 data
  // to model years outside the covered generation (e.g. a hypothetical 2025 Micra).
  const range = MODEL_YEAR_RANGES[modelKey];
  if (range && (year < range[0] || year > range[1])) return null;

  const key = `${modelKey}::${taskType}` as SeedKey;
  const seed = SEED[key];
  if (!seed) return null;
  return { ...seed, make: "Nissan", model: model.trim(), year };
}

/** Returns true only for Nissan models that have actual seeded NICOclub data. */
export function nissanSupports(model: string): boolean {
  return SUPPORTED_MODELS.some((m) => model.toLowerCase().includes(m));
}

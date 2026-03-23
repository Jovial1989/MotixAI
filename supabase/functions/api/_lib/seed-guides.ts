import { getDb, newId } from "./db.ts";

interface SeedStep {
  title: string;
  instruction: string;
  torqueValue?: string;
  warningNote?: string;
}

interface SeedGuide {
  vehicleModel: string;
  partName: string;
  title: string;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  steps: SeedStep[];
}

const EXAMPLE_GUIDES: SeedGuide[] = [
  {
    vehicleModel: "BMW E90 3-Series",
    partName: "Oil Change",
    title: "BMW E90 3-Series Oil Change",
    difficulty: "Beginner",
    timeEstimate: "45-60 min",
    tools: ["Oil drain pan", "17mm socket", "Oil filter wrench", "Funnel", "Torque wrench"],
    safetyNotes: [
      "Allow engine to cool for 15 minutes before starting.",
      "Never dispose of old oil in the drain — take it to a recycling centre.",
    ],
    steps: [
      { title: "Warm up engine", instruction: "Run the engine for 2–3 minutes to warm the oil so it drains completely, then switch off." },
      { title: "Lift and secure vehicle", instruction: "Jack up the car and support it on axle stands. Never work under a car supported only by a jack.", warningNote: "Ensure axle stands are on solid ground and rated for the vehicle weight." },
      { title: "Remove drain plug", instruction: "Place the drain pan under the sump. Using a 17mm socket, remove the drain plug and allow oil to drain fully.", torqueValue: "25 Nm on reinstall" },
      { title: "Remove oil filter", instruction: "Using an oil filter wrench, unscrew the cartridge filter housing located on the top of the engine. Remove the old filter element." },
      { title: "Install new filter", instruction: "Insert the new filter element, replace the O-ring with the one supplied, and hand-tighten the housing then torque to spec.", torqueValue: "18 Nm" },
      { title: "Reinstall drain plug", instruction: "Clean the drain plug and install a new sealing washer. Refit and torque the plug.", torqueValue: "25 Nm" },
      { title: "Add new oil", instruction: "Remove the oil filler cap on the valve cover. Using a funnel, add 5.5 L of 5W-30 long-life oil." },
      { title: "Check level and leaks", instruction: "Start the engine and let it idle for 1 minute. Check for leaks around the drain plug and filter. Switch off and check the dipstick — level should read between MIN and MAX." },
    ],
  },
  {
    vehicleModel: "Nissan Qashqai J10",
    partName: "Brake Pads",
    title: "Nissan Qashqai J10 Front Brake Pad Replacement",
    difficulty: "Intermediate",
    timeEstimate: "1.5 - 2 hours",
    tools: ["Socket set", "C-clamp or brake piston tool", "Wire brush", "Brake cleaner", "Torque wrench", "Flat screwdriver"],
    safetyNotes: [
      "Never compress the brake pedal while a caliper is removed.",
      "Wear gloves — brake dust is hazardous.",
      "Pump the brake pedal 10–15 times before moving the vehicle after reassembly.",
    ],
    steps: [
      { title: "Loosen wheel nuts", instruction: "With the vehicle on the ground, crack the wheel nuts loose half a turn on both front wheels." },
      { title: "Raise and support vehicle", instruction: "Jack up the front of the vehicle and secure on axle stands. Remove both front wheels.", warningNote: "Use proper axle stand positions as per the vehicle manual." },
      { title: "Inspect existing pads", instruction: "Before removal, note the thickness of the existing pads and confirm they need replacement (less than 3mm is the typical minimum)." },
      { title: "Remove caliper guide bolts", instruction: "Using a 12mm socket, remove the two caliper guide bolts at the back of the caliper. Slide the caliper off the disc.", warningNote: "Do not let the caliper hang by the brake hose — support it with a hook or wire." },
      { title: "Remove old brake pads", instruction: "Slide out the old inner and outer brake pads from the caliper bracket. Note which direction they face." },
      { title: "Clean bracket and hardware", instruction: "Use a wire brush and brake cleaner to clean the caliper bracket slide areas. Lightly lubricate slide pins with copper grease." },
      { title: "Compress caliper piston", instruction: "Place a piece of old pad against the piston and use a C-clamp to slowly compress the piston fully into the caliper body. Check the brake fluid reservoir does not overflow.", torqueValue: "N/A" },
      { title: "Install new pads", instruction: "Clip the new inner pad into the piston and the outer pad into the caliper bracket. Ensure anti-squeal shims are correctly seated." },
      { title: "Refit caliper", instruction: "Slide the caliper back over the new pads and start the guide bolts by hand. Torque to specification.", torqueValue: "34 Nm" },
      { title: "Refit wheels and bed in pads", instruction: "Refit wheels and torque wheel nuts. Lower vehicle. Pump brake pedal until firm. Perform 5–10 moderate stops from 40 km/h to bed in the new pads.", torqueValue: "Wheel nuts: 100 Nm" },
    ],
  },
  {
    vehicleModel: "Toyota Land Cruiser 200",
    partName: "Turbocharger",
    title: "Toyota Land Cruiser 200 Series (1VD-FTV) Turbocharger Replacement Guide",
    difficulty: "Advanced",
    timeEstimate: "8 - 12 hours",
    tools: ["Socket set (metric)", "Torque wrench", "Extension bars", "Oil line disconnect tool", "Gasket scraper", "Threadlocker", "Vacuum pump"],
    safetyNotes: [
      "Allow turbo and exhaust manifold to cool completely — surfaces reach over 900°C in operation.",
      "Relieve fuel system pressure before disconnecting any fuel lines.",
      "Use new gaskets, seals, and oil feed/return lines — reusing old ones risks oil leaks and premature turbo failure.",
    ],
    steps: [
      { title: "Prepare and depressurise", instruction: "Disconnect the negative battery terminal. Allow the engine to cool for at least 2 hours. Drain engine oil and coolant into appropriate containers." },
      { title: "Remove engine cover and air intake", instruction: "Remove the plastic engine cover (4 bolts). Disconnect the air intake pipe from the turbo inlet and remove the intercooler pipes." },
      { title: "Disconnect oil feed line", instruction: "Using the oil line disconnect tool, remove the banjo bolt on the turbo oil feed line. Cap the feed line to prevent contamination." },
      { title: "Disconnect oil return line", instruction: "Remove the two bolts securing the oil return (drain) line flange at the turbo base. Expect residual oil to drain." },
      { title: "Disconnect coolant lines (water-cooled turbo)", instruction: "Clamp and disconnect both coolant feed and return lines from the turbo centre housing.", warningNote: "Have rags ready — residual coolant will spill." },
      { title: "Disconnect exhaust downpipe", instruction: "Remove the three nuts securing the exhaust downpipe to the turbo outlet flange. Support the downpipe." },
      { title: "Remove turbo-to-manifold mounting nuts", instruction: "Remove the four nuts securing the turbo to the exhaust manifold. These are often seized — use penetrating oil and allow 20 minutes to soak.", torqueValue: "Penetrating oil soak required" },
      { title: "Extract turbocharger", instruction: "Carefully manoeuvre the turbo out of the engine bay. The unit is heavy — use an assistant or engine support bar." },
      { title: "Clean all mating surfaces", instruction: "Using a gasket scraper and brake cleaner, clean the manifold flange, oil feed port, and return port. Ensure no old gasket material remains." },
      { title: "Pre-lubricate new turbo", instruction: "Before installation, pour approximately 50ml of clean engine oil into the turbo oil inlet port and rotate the shaft by hand to distribute oil.", warningNote: "Never start the engine immediately after turbo installation without pre-lubricating." },
      { title: "Install new turbocharger", instruction: "Fit new manifold-to-turbo gasket and carefully seat the new turbo. Start all four mounting nuts by hand, then torque evenly in a cross pattern.", torqueValue: "43 Nm" },
      { title: "Reconnect all lines and pipes", instruction: "Reconnect oil feed (new sealing washers), oil return (new gasket), coolant lines, exhaust downpipe (new gasket), and intake piping. Torque all fasteners to spec.", torqueValue: "Oil feed banjo bolt: 32 Nm | Downpipe: 43 Nm" },
      { title: "Refill fluids and verify", instruction: "Refill engine oil and coolant. Prime the oil system by cranking (without starting) for 10 seconds. Start and idle for 5 minutes — check for oil or coolant leaks around the turbo." },
    ],
  },
  {
    vehicleModel: "Mercedes W222 S-Class",
    partName: "Timing Chain",
    title: "Mercedes W222 S-Class Timing Chain Replacement Guide (M276/M278 Engine)",
    difficulty: "Expert",
    timeEstimate: "25 - 40 hours",
    tools: ["Mercedes STAR diagnostic tool", "Timing chain locking set (M276/M278)", "Camshaft holding tool", "Harmonic balancer puller", "Torque wrench (angular)", "Crankshaft locking pin"],
    safetyNotes: [
      "This is an expert-level job requiring Mercedes-specific special tools. Incorrect timing will cause catastrophic engine damage.",
      "The M276/M278 has dual-chain assemblies — both primary and secondary chains must be replaced together.",
      "Rotate engine only clockwise when setting timing — never reverse rotation with chains removed.",
    ],
    steps: [
      { title: "Scan and document", instruction: "Connect STAR diagnostic tool. Record all stored faults and live data. Confirm timing chain wear is the root cause (rattling at cold start, cam timing codes P0016/P0017)." },
      { title: "Remove front assembly", instruction: "Remove engine cover, front bumper, radiator, and slam panel to gain clear access to the timing chain cover at the front of the engine." },
      { title: "Drain fluids", instruction: "Drain engine oil, coolant, and power steering fluid. Remove the oil filter housing." },
      { title: "Remove accessories and damper", instruction: "Remove alternator, AC compressor, power steering pump, and idler pulleys. Use harmonic balancer puller to remove the crankshaft damper.", torqueValue: "Crankshaft damper bolt: 200 Nm + 90°" },
      { title: "Set engine to TDC", instruction: "Rotate crankshaft clockwise to TDC on cylinder 1. Insert crankshaft locking pin through the timing cover into the crankshaft.", warningNote: "Confirm both camshafts are aligned to their TDC marks before inserting the locking pin." },
      { title: "Lock all camshafts", instruction: "Install camshaft holding tools on all four camshafts (bank 1 and bank 2 intake and exhaust). Do not remove until new chains are installed and tensioned." },
      { title: "Remove timing chain cover", instruction: "Remove all cover bolts (note different lengths and thread types). Carefully prise the cover away — do not damage the sealing surface." },
      { title: "Remove secondary chain tensioners", instruction: "Release both secondary chain tensioners and remove the secondary chains on each camshaft bank. Mark all components for reference." },
      { title: "Remove primary chain", instruction: "Release the primary chain tensioner. Remove the primary chain, guides, and tensioner rail. Inspect all sprockets for wear — replace any showing hooked or worn teeth." },
      { title: "Install new primary chain", instruction: "Route the new primary chain over the crankshaft sprocket and both intake cam sprockets. Ensure coloured links align with sprocket timing marks." },
      { title: "Install new secondary chains", instruction: "Fit new secondary chains on each bank, aligning timing marks. Install new tensioners and guides." },
      { title: "Remove locking tools and verify timing", instruction: "Remove all camshaft holding tools and crankshaft locking pin. Rotate engine two full turns by hand (clockwise only) and verify all timing marks return to TDC alignment.", warningNote: "If any timing marks are misaligned, stop immediately and re-time before proceeding." },
      { title: "Seal and refit cover", instruction: "Apply Mercedes-approved sealant (A 003 989 88 20) to the timing cover sealing surface. Refit cover and torque all bolts in sequence.", torqueValue: "Cover bolts: 10 Nm (M6) | 25 Nm (M8)" },
      { title: "Reassemble and verify", instruction: "Refit all accessories, fill fluids, and connect battery. Start engine and check for chain noise. Use STAR tool to verify cam timing correlation values are within spec. Clear all fault codes." },
    ],
  },
];

export async function seedExampleGuides(userId: string, tenantId?: string | null): Promise<void> {
  const sql = getDb();
  const now = new Date().toISOString();
  const tid = tenantId ?? null;

  for (const g of EXAMPLE_GUIDES) {
    const vehicleId = newId();
    await sql`
      INSERT INTO "Vehicle" (id, "tenantId", model, "createdAt", "updatedAt")
      VALUES (${vehicleId}, ${tid}, ${g.vehicleModel}, ${now}, ${now})
    `;

    const partId = newId();
    await sql`
      INSERT INTO "Part" (id, "tenantId", name, "createdAt", "updatedAt")
      VALUES (${partId}, ${tid}, ${g.partName}, ${now}, ${now})
    `;

    const guideId = newId();
    await sql`
      INSERT INTO "RepairGuide" (
        id, "tenantId", "userId", "vehicleId", "partId",
        title, difficulty, "timeEstimate", "safetyNotes", tools,
        "inputModel", "inputPart", "sourceType", "language", "canonicalGuideId", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${tid}, ${userId}, ${vehicleId}, ${partId},
        ${g.title}, ${g.difficulty}, ${g.timeEstimate},
        ${g.safetyNotes}, ${g.tools},
        ${g.vehicleModel}, ${g.partName}, ${"B2C"}, ${"en"}, ${guideId}, ${now}, ${now}
      )
    `;

    for (let i = 0; i < g.steps.length; i++) {
      const step = g.steps[i];
      await sql`
        INSERT INTO "RepairStep" (
          id, "guideId", "stepOrder", title, instruction,
          "torqueValue", "warningNote", "createdAt"
        ) VALUES (
          ${newId()}, ${guideId}, ${i + 1}, ${step.title}, ${step.instruction},
          ${step.torqueValue ?? null}, ${step.warningNote ?? null}, ${now}
        )
      `;
    }
  }
}

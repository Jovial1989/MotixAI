-- Seed the 3 canonical demo guides with fixed IDs so guest mode works with real DB rows.
-- These IDs must match DEMO_GUIDE_IDS in guides.ts.

-- Demo system user (required by RepairGuide FK constraint)
INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "createdAt", "updatedAt")
VALUES ('demo', 'demo@motixi.app', '', 'Demo User', 'USER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Vehicles
INSERT INTO "Vehicle" (id, "tenantId", model, "createdAt", "updatedAt")
VALUES
  ('demo-v1', NULL, 'BMW E90 3-Series', NOW(), NOW()),
  ('demo-v2', NULL, 'Nissan Qashqai J10', NOW(), NOW()),
  ('demo-v3', NULL, 'Toyota Land Cruiser 200', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Parts
INSERT INTO "Part" (id, "tenantId", name, "createdAt", "updatedAt")
VALUES
  ('demo-p1', NULL, 'Oil Change', NOW(), NOW()),
  ('demo-p2', NULL, 'Brake Pads', NOW(), NOW()),
  ('demo-p3', NULL, 'Turbocharger', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Guide 1: BMW E90 Oil Change
INSERT INTO "RepairGuide" (
  id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
  "timeEstimate", "safetyNotes", tools, "inputModel", "inputPart",
  "sourceType", source, "createdAt", "updatedAt"
) VALUES (
  'cmmd40lbh001n10js9vgydyku', NULL, 'demo', 'demo-v1', 'demo-p1',
  'BMW E90 3-Series Oil Change', 'Beginner', '45-60 min',
  ARRAY['Allow engine to cool for 15 minutes before starting.', 'Never dispose of old oil in the drain — take it to a recycling centre.'],
  ARRAY['Oil drain pan', '17mm socket', 'Oil filter wrench', 'Funnel', 'Torque wrench'],
  'BMW E90 3-Series', 'Oil Change', 'B2C', 'demo', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
VALUES
  ('demo-s1a', 'cmmd40lbh001n10js9vgydyku', 1, 'Warm up engine', 'Run the engine for 2–3 minutes to warm the oil so it drains completely, then switch off.', NULL, NULL, NOW()),
  ('demo-s1b', 'cmmd40lbh001n10js9vgydyku', 2, 'Lift and secure vehicle', 'Jack up the car and support it on axle stands. Never work under a car supported only by a jack.', NULL, 'Ensure axle stands are on solid ground and rated for the vehicle weight.', NOW()),
  ('demo-s1c', 'cmmd40lbh001n10js9vgydyku', 3, 'Remove drain plug', 'Place the drain pan under the sump. Using a 17mm socket, remove the drain plug and allow oil to drain fully.', '25 Nm on reinstall', NULL, NOW()),
  ('demo-s1d', 'cmmd40lbh001n10js9vgydyku', 4, 'Remove oil filter', 'Using an oil filter wrench, unscrew the cartridge filter housing located on the top of the engine. Remove the old filter element.', NULL, NULL, NOW()),
  ('demo-s1e', 'cmmd40lbh001n10js9vgydyku', 5, 'Install new filter', 'Insert the new filter element, replace the O-ring with the one supplied, and hand-tighten the housing then torque to spec.', '18 Nm', NULL, NOW()),
  ('demo-s1f', 'cmmd40lbh001n10js9vgydyku', 6, 'Reinstall drain plug', 'Clean the drain plug and install a new sealing washer. Refit and torque the plug.', '25 Nm', NULL, NOW()),
  ('demo-s1g', 'cmmd40lbh001n10js9vgydyku', 7, 'Add new oil', 'Remove the oil filler cap on the valve cover. Using a funnel, add 5.5 L of 5W-30 long-life oil.', NULL, NULL, NOW()),
  ('demo-s1h', 'cmmd40lbh001n10js9vgydyku', 8, 'Check level and leaks', 'Start the engine and let it idle for 1 minute. Check for leaks around the drain plug and filter. Switch off and check the dipstick — level should read between MIN and MAX.', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Guide 2: Nissan Qashqai Brake Pads
INSERT INTO "RepairGuide" (
  id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
  "timeEstimate", "safetyNotes", tools, "inputModel", "inputPart",
  "sourceType", source, "createdAt", "updatedAt"
) VALUES (
  'cmmitf5zp000vhs3mgt9zbi5p', NULL, 'demo', 'demo-v2', 'demo-p2',
  'Nissan Qashqai J10 Front Brake Pad Replacement', 'Intermediate', '1.5 - 2 hours',
  ARRAY['Never compress the brake pedal while a caliper is removed.', 'Wear gloves — brake dust is hazardous.', 'Pump the brake pedal 10–15 times before moving the vehicle after reassembly.'],
  ARRAY['Socket set', 'C-clamp or brake piston tool', 'Wire brush', 'Brake cleaner', 'Torque wrench', 'Flat screwdriver'],
  'Nissan Qashqai J10', 'Brake Pads', 'B2C', 'demo', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
VALUES
  ('demo-s2a', 'cmmitf5zp000vhs3mgt9zbi5p', 1, 'Loosen wheel nuts', 'With the vehicle on the ground, crack the wheel nuts loose half a turn on both front wheels.', NULL, NULL, NOW()),
  ('demo-s2b', 'cmmitf5zp000vhs3mgt9zbi5p', 2, 'Raise and support vehicle', 'Jack up the front of the vehicle and secure on axle stands. Remove both front wheels.', NULL, 'Use proper axle stand positions as per the vehicle manual.', NOW()),
  ('demo-s2c', 'cmmitf5zp000vhs3mgt9zbi5p', 3, 'Inspect existing pads', 'Before removal, note the thickness of the existing pads and confirm they need replacement (less than 3mm is the typical minimum).', NULL, NULL, NOW()),
  ('demo-s2d', 'cmmitf5zp000vhs3mgt9zbi5p', 4, 'Remove caliper guide bolts', 'Using a 12mm socket, remove the two caliper guide bolts at the back of the caliper. Slide the caliper off the disc.', NULL, 'Do not let the caliper hang by the brake hose — support it with a hook or wire.', NOW()),
  ('demo-s2e', 'cmmitf5zp000vhs3mgt9zbi5p', 5, 'Remove old brake pads', 'Slide out the old inner and outer brake pads from the caliper bracket. Note which direction they face.', NULL, NULL, NOW()),
  ('demo-s2f', 'cmmitf5zp000vhs3mgt9zbi5p', 6, 'Clean bracket and hardware', 'Use a wire brush and brake cleaner to clean the caliper bracket slide areas. Lightly lubricate slide pins with copper grease.', NULL, NULL, NOW()),
  ('demo-s2g', 'cmmitf5zp000vhs3mgt9zbi5p', 7, 'Compress caliper piston', 'Place a piece of old pad against the piston and use a C-clamp to slowly compress the piston fully into the caliper body. Check the brake fluid reservoir does not overflow.', NULL, NULL, NOW()),
  ('demo-s2h', 'cmmitf5zp000vhs3mgt9zbi5p', 8, 'Install new pads', 'Clip the new inner pad into the piston and the outer pad into the caliper bracket. Ensure anti-squeal shims are correctly seated.', NULL, NULL, NOW()),
  ('demo-s2i', 'cmmitf5zp000vhs3mgt9zbi5p', 9, 'Refit caliper', 'Slide the caliper back over the new pads and start the guide bolts by hand. Torque to specification.', '34 Nm', NULL, NOW()),
  ('demo-s2j', 'cmmitf5zp000vhs3mgt9zbi5p', 10, 'Refit wheels and bed in pads', 'Refit wheels and torque wheel nuts. Lower vehicle. Pump brake pedal until firm. Perform 5–10 moderate stops from 40 km/h to bed in the new pads.', 'Wheel nuts: 100 Nm', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Guide 3: Toyota Land Cruiser Turbocharger
INSERT INTO "RepairGuide" (
  id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
  "timeEstimate", "safetyNotes", tools, "inputModel", "inputPart",
  "sourceType", source, "createdAt", "updatedAt"
) VALUES (
  'cmmd40wtg002f10jsh3jyvkbu', NULL, 'demo', 'demo-v3', 'demo-p3',
  'Toyota Land Cruiser 200 Series (1VD-FTV) Turbocharger Replacement Guide', 'Advanced', '8 - 12 hours',
  ARRAY['Allow turbo and exhaust manifold to cool completely — surfaces reach over 900°C in operation.', 'Relieve fuel system pressure before disconnecting any fuel lines.', 'Use new gaskets, seals, and oil feed/return lines — reusing old ones risks oil leaks and premature turbo failure.'],
  ARRAY['Socket set (metric)', 'Torque wrench', 'Extension bars', 'Oil line disconnect tool', 'Gasket scraper', 'Threadlocker', 'Vacuum pump'],
  'Toyota Land Cruiser 200', 'Turbocharger', 'B2C', 'demo', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
VALUES
  ('demo-s3a', 'cmmd40wtg002f10jsh3jyvkbu', 1, 'Prepare and depressurise', 'Disconnect the negative battery terminal. Allow the engine to cool for at least 2 hours. Drain engine oil and coolant into appropriate containers.', NULL, NULL, NOW()),
  ('demo-s3b', 'cmmd40wtg002f10jsh3jyvkbu', 2, 'Remove engine cover and air intake', 'Remove the plastic engine cover (4 bolts). Disconnect the air intake pipe from the turbo inlet and remove the intercooler pipes.', NULL, NULL, NOW()),
  ('demo-s3c', 'cmmd40wtg002f10jsh3jyvkbu', 3, 'Disconnect oil feed line', 'Using the oil line disconnect tool, remove the banjo bolt on the turbo oil feed line. Cap the feed line to prevent contamination.', NULL, NULL, NOW()),
  ('demo-s3d', 'cmmd40wtg002f10jsh3jyvkbu', 4, 'Disconnect oil return line', 'Remove the two bolts securing the oil return (drain) line flange at the turbo base. Expect residual oil to drain.', NULL, NULL, NOW()),
  ('demo-s3e', 'cmmd40wtg002f10jsh3jyvkbu', 5, 'Disconnect coolant lines (water-cooled turbo)', 'Clamp and disconnect both coolant feed and return lines from the turbo centre housing.', NULL, 'Have rags ready — residual coolant will spill.', NOW()),
  ('demo-s3f', 'cmmd40wtg002f10jsh3jyvkbu', 6, 'Disconnect exhaust downpipe', 'Remove the three nuts securing the exhaust downpipe to the turbo outlet flange. Support the downpipe.', NULL, NULL, NOW()),
  ('demo-s3g', 'cmmd40wtg002f10jsh3jyvkbu', 7, 'Remove turbo-to-manifold mounting nuts', 'Remove the four nuts securing the turbo to the exhaust manifold. These are often seized — use penetrating oil and allow 20 minutes to soak.', 'Penetrating oil soak required', NULL, NOW()),
  ('demo-s3h', 'cmmd40wtg002f10jsh3jyvkbu', 8, 'Extract turbocharger', 'Carefully manoeuvre the turbo out of the engine bay. The unit is heavy — use an assistant or engine support bar.', NULL, NULL, NOW()),
  ('demo-s3i', 'cmmd40wtg002f10jsh3jyvkbu', 9, 'Clean all mating surfaces', 'Using a gasket scraper and brake cleaner, clean the manifold flange, oil feed port, and return port. Ensure no old gasket material remains.', NULL, NULL, NOW()),
  ('demo-s3j', 'cmmd40wtg002f10jsh3jyvkbu', 10, 'Pre-lubricate new turbo', 'Before installation, pour approximately 50ml of clean engine oil into the turbo oil inlet port and rotate the shaft by hand to distribute oil.', NULL, 'Never start the engine immediately after turbo installation without pre-lubricating.', NOW()),
  ('demo-s3k', 'cmmd40wtg002f10jsh3jyvkbu', 11, 'Install new turbocharger', 'Fit new manifold-to-turbo gasket and carefully seat the new turbo. Start all four mounting nuts by hand, then torque evenly in a cross pattern.', '43 Nm', NULL, NOW()),
  ('demo-s3l', 'cmmd40wtg002f10jsh3jyvkbu', 12, 'Reconnect all lines and pipes', 'Reconnect oil feed (new sealing washers), oil return (new gasket), coolant lines, exhaust downpipe (new gasket), and intake piping. Torque all fasteners to spec.', 'Oil feed banjo bolt: 32 Nm | Downpipe: 43 Nm', NULL, NOW()),
  ('demo-s3m', 'cmmd40wtg002f10jsh3jyvkbu', 13, 'Refill fluids and verify', 'Refill engine oil and coolant. Prime the oil system by cranking (without starting) for 10 seconds. Start and idle for 5 minutes — check for oil or coolant leaks around the turbo.', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

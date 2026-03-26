export interface VehicleIdentityInput {
  vehicleModel?: string | null;
  make?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | string | null;
  generation?: string | null;
}

export interface VehicleIdentity {
  displayName: string;
  cacheKey: string;
  make: string | null;
  manufacturer: string | null;
  modelName: string;
  year: number | null;
  generation: string | null;
}

const KNOWN_MAKES = [
  "Mercedes-Benz",
  "Land Rover",
  "Range Rover",
  "Alfa Romeo",
  "Aston Martin",
  "Rolls-Royce",
  "General Motors",
  "Great Wall",
  "John Deere",
  "Mitsubishi",
  "Volkswagen",
  "Chevrolet",
  "Cadillac",
  "Chrysler",
  "Peugeot",
  "Renault",
  "Lincoln",
  "Porsche",
  "Toyota",
  "Nissan",
  "Infiniti",
  "Hyundai",
  "Genesis",
  "Mercedes",
  "Subaru",
  "Suzuki",
  "Citroen",
  "Citroën",
  "Volvo",
  "Mazda",
  "Honda",
  "Lexus",
  "Jaguar",
  "Ferrari",
  "Bentley",
  "Audi",
  "BMW",
  "BYD",
  "GMC",
  "Kia",
  "Jeep",
  "Ford",
  "Fiat",
  "Ram",
  "MINI",
  "Opel",
  "Seat",
  "Skoda",
  "Škoda",
  "Tesla",
].sort((a, b) => b.length - a.length);

const PREFIX_GENERATION_MAKES = new Set([
  "audi",
  "bmw",
  "lexus",
  "mercedes",
  "mercedes-benz",
]);

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseYear(raw: number | string | null | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1900 && raw <= new Date().getFullYear() + 1) {
    return raw;
  }
  if (typeof raw !== "string") return null;
  const match = raw.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyGenerationToken(token: string): boolean {
  return /^(?:[A-Z]\d{2,3}|[A-Z]{2}\d{2,3}|J\d{1,2}|MK\d+|GEN[-\s]?\d+|E\d{2}|F\d{2}|G\d{2}|W\d{3})$/i.test(token);
}

function pullMake(raw: string): { make: string | null; remainder: string } {
  const value = cleanText(raw);
  if (!value) return { make: null, remainder: "" };
  const lower = value.toLowerCase();
  for (const make of KNOWN_MAKES) {
    if (lower.startsWith(make.toLowerCase())) {
      return {
        make,
        remainder: cleanText(value.slice(make.length)),
      };
    }
  }
  const first = value.split(" ")[0] ?? value;
  return { make: first, remainder: cleanText(value.slice(first.length)) };
}

function splitModelAndGeneration(
  make: string | null,
  rawModel: string,
  explicitGeneration?: string | null,
): { modelName: string; generation: string | null } {
  const cleanedModel = cleanText(rawModel);
  if (!cleanedModel) {
    return {
      modelName: "",
      generation: cleanText(explicitGeneration) || null,
    };
  }

  const trimGenerationToken = (value: string, generationToken: string): string => {
    const normalizedGeneration = cleanText(generationToken);
    if (!normalizedGeneration) return cleanText(value);

    let tokens = cleanText(value).split(" ").filter(Boolean);
    const generationLower = normalizedGeneration.toLowerCase();
    const makeKey = cleanText(make).toLowerCase();

    while (tokens.length > 1 && (tokens[tokens.length - 1] ?? "").toLowerCase() === generationLower) {
      tokens = tokens.slice(0, -1);
    }

    while (
      tokens.length > 1 &&
      PREFIX_GENERATION_MAKES.has(makeKey) &&
      (tokens[0] ?? "").toLowerCase() === generationLower
    ) {
      tokens = tokens.slice(1);
    }

    return cleanText(tokens.join(" "));
  };

  if (explicitGeneration && cleanText(explicitGeneration)) {
    const normalizedGeneration = cleanText(explicitGeneration);
    return {
      modelName: trimGenerationToken(cleanedModel, normalizedGeneration) || cleanedModel,
      generation: normalizedGeneration,
    };
  }

  const tokens = cleanedModel.split(" ").filter(Boolean);
  if (tokens.length >= 2) {
    const prefixCandidate = tokens[0] ?? "";
    const suffixCandidate = tokens[tokens.length - 1] ?? "";
    const makeKey = cleanText(make).toLowerCase();

    if (PREFIX_GENERATION_MAKES.has(makeKey) && isLikelyGenerationToken(prefixCandidate)) {
      return {
        modelName: trimGenerationToken(cleanedModel, prefixCandidate) || cleanText(tokens.slice(1).join(" ")) || cleanedModel,
        generation: prefixCandidate,
      };
    }

    if (isLikelyGenerationToken(suffixCandidate)) {
      return {
        modelName: trimGenerationToken(cleanedModel, suffixCandidate) || cleanText(tokens.slice(0, -1).join(" ")) || cleanedModel,
        generation: suffixCandidate,
      };
    }
  }

  return { modelName: cleanedModel, generation: null };
}

function slugifyVehicle(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveVehicleIdentity(input: VehicleIdentityInput): VehicleIdentity {
  const explicitMake = cleanText(input.make ?? input.manufacturer) || null;
  const explicitModel = cleanText(input.model) || null;
  const explicitGeneration = cleanText(input.generation) || null;
  const explicitYear = parseYear(input.year);
  const displayInput = cleanText(input.vehicleModel);

  const yearFromDisplay = explicitYear ?? parseYear(displayInput);
  const displayWithoutYear = yearFromDisplay
    ? cleanText(displayInput.replace(new RegExp(`\\b${yearFromDisplay}\\b`), ""))
    : displayInput;

  const makeSource = explicitMake ?? pullMake(displayWithoutYear).make;
  const remainderSource = explicitModel ?? (explicitMake ? displayWithoutYear.replace(new RegExp(`^${explicitMake}\\s*`, "i"), "").trim() : pullMake(displayWithoutYear).remainder);
  const { modelName, generation } = splitModelAndGeneration(makeSource, remainderSource || displayWithoutYear || explicitModel || "", explicitGeneration);

  const composedDisplay = cleanText([
    yearFromDisplay ? String(yearFromDisplay) : "",
    makeSource ?? "",
    modelName,
    generation ?? "",
  ].filter(Boolean).join(" "));

  const displayName = composedDisplay || displayInput || cleanText([input.make, input.model, input.generation].filter(Boolean).join(" ")) || "Unknown vehicle";
  const cacheKey = slugifyVehicle(displayName);

  return {
    displayName,
    cacheKey,
    make: makeSource,
    manufacturer: makeSource,
    modelName: modelName || displayName,
    year: yearFromDisplay,
    generation: generation ?? explicitGeneration,
  };
}

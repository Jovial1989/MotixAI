const GUIDE_IMAGES_BUCKET = "guide-images";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} env var is required`);
  return value;
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string; extension: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Expected base64 data URL");
  const contentType = match[1] || "image/png";
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const extension = contentType.includes("jpeg") ? "jpg" : "png";
  return { bytes, contentType, extension };
}

export function publicGuideImageUrl(path: string): string {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  return `${supabaseUrl}/storage/v1/object/public/${GUIDE_IMAGES_BUCKET}/${path}`;
}

export async function uploadGuideImage(dataUrl: string, guideId: string, stepId: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { bytes, contentType, extension } = decodeDataUrl(dataUrl);
  const objectPath = `${guideId}/${stepId}.${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${GUIDE_IMAGES_BUCKET}/${objectPath}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": contentType,
      "x-upsert": "true",
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const message = await uploadRes.text();
    throw new Error(`Storage upload failed: ${uploadRes.status} ${message}`);
  }

  return publicGuideImageUrl(objectPath);
}

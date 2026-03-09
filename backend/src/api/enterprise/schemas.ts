import { z } from 'zod';

export const uploadManualSchema = z.object({
  title: z.string().min(3),
  fileUrl: z.string().url(),
  extractedText: z.string().optional(),
  vehicleModel: z.string().optional(),
});

export const enterpriseGuideSchema = z.object({
  manualId: z.string(),
  vehicleModel: z.string().min(2),
  partName: z.string().min(2),
  oemNumber: z.string().optional(),
});

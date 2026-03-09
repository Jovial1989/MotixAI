import { z } from 'zod';

export const createRequestSchema = z.object({
  vehicleModel: z.string().min(1),
  repairType: z.string().min(1),
  partNumber: z.string().optional(),
  notes: z.string().optional(),
});

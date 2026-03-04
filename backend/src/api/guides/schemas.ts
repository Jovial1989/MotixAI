import { z } from 'zod';

export const createGuideSchema = z.object({
  vin: z.string().min(5).optional(),
  vehicleModel: z.string().min(2).optional(),
  partName: z.string().min(2),
  oemNumber: z.string().optional(),
}).refine((value) => value.vin || value.vehicleModel, {
  message: 'vin or vehicleModel is required',
});

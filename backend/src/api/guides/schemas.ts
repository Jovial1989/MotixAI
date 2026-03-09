import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const createGuideSchema = z.object({
  vin: z.preprocess(emptyToUndefined, z.string().min(5).optional()),
  vehicleModel: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  partName: z.string().min(2),
  oemNumber: z.preprocess(emptyToUndefined, z.string().optional()),
}).refine((value) => value.vin || value.vehicleModel, {
  message: 'vin or vehicleModel is required',
});

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

export const createSourceGuideSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1980).max(2030),
  component: z.string().min(2),
  taskType: z.enum([
    'oil_change',
    'brake_pad_replacement',
    'brake_fluid_flush',
    'timing_belt',
    'coolant_flush',
  ]),
});

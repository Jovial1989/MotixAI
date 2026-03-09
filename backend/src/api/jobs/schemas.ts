import { z } from 'zod';

export const createJobSchema = z.object({
  vehicleId: z.string().min(1),
  guideId: z.string().optional(),
  problemDescription: z.string().min(1),
  assignedTechnicianId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateJobSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
  notes: z.string().optional(),
});

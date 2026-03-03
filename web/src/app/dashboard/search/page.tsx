'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { Search, Loader2, AlertCircle } from 'lucide-react';

const schema = z.object({
  vin: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().optional(),
  partName: z.string().optional(),
  partOem: z.string().optional(),
}).refine(
  (d) => d.vin || (d.vehicleMake && d.vehicleModel),
  { message: 'Enter a VIN or vehicle make + model', path: ['vin'] }
).refine(
  (d) => d.partName || d.partOem,
  { message: 'Enter a part name or OEM number', path: ['partName'] }
);

type FormData = z.infer<typeof schema>;

type InputMode = 'vin' | 'manual';

export default function SearchPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await apiClient.post('/guides', data);
      router.push(`/dashboard/guide/${res.data.data.id}`);
    } catch {
      setError('Failed to create guide. Please try again.');
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Search repair guide</h1>
          <p className="mt-1 text-neutral-500">Enter your vehicle and the part you need to repair</p>
        </div>

        <div className="card p-6">
          {/* Toggle */}
          <div className="mb-6 flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${inputMode === 'manual' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Make / Model
            </button>
            <button
              type="button"
              onClick={() => setInputMode('vin')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${inputMode === 'vin' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              VIN number
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Vehicle section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-700">Vehicle</h3>
              {inputMode === 'vin' ? (
                <div>
                  <label className="mb-1 block text-sm text-neutral-600">VIN number</label>
                  <input
                    {...register('vin')}
                    placeholder="e.g. 1HGCM82633A123456"
                    className="input font-mono uppercase"
                  />
                  {errors.vin && <p className="mt-1 text-xs text-red-500">{errors.vin.message}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-neutral-600">Make</label>
                    <input {...register('vehicleMake')} placeholder="Toyota" className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-neutral-600">Model</label>
                    <input {...register('vehicleModel')} placeholder="Camry" className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-neutral-600">Year</label>
                    <input {...register('vehicleYear')} type="number" placeholder="2020" className="input" />
                  </div>
                  {errors.vehicleMake && <p className="col-span-3 -mt-2 text-xs text-red-500">{errors.vehicleMake.message}</p>}
                </div>
              )}
            </div>

            {/* Part section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-700">Part</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-neutral-600">Part name</label>
                  <input {...register('partName')} placeholder="Brake pads front" className="input" />
                  {errors.partName && <p className="mt-1 text-xs text-red-500">{errors.partName.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-neutral-600">OEM number (optional)</label>
                  <input {...register('partOem')} placeholder="04465-06110" className="input font-mono" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating guide…</>
              ) : (
                <><Search className="h-4 w-4" /> Generate repair guide</>
              )}
            </button>
          </form>
        </div>

        {/* Hints */}
        <div className="mt-4 rounded-md bg-neutral-50 px-5 py-4">
          <p className="text-sm font-medium text-neutral-700 mb-2">Tips</p>
          <ul className="space-y-1 text-sm text-neutral-500">
            <li>• Be specific with the part name for better results</li>
            <li>• VIN gives the most accurate vehicle identification</li>
            <li>• OEM number + make/model yields the most precise guide</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { ManualDocument, RepairGuide } from '@motixai/shared';
import { webApi } from '@/lib/api';

export default function EnterprisePage() {
  const [manuals, setManuals] = useState<ManualDocument[]>([]);
  const [generated, setGenerated] = useState<RepairGuide | null>(null);

  useEffect(() => {
    webApi.listManuals().then(setManuals).catch(() => setManuals([]));
  }, []);

  async function uploadManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const manual = await webApi.uploadManual({
      title: String(data.get('title')),
      fileUrl: String(data.get('fileUrl')),
      extractedText: String(data.get('extractedText') || ''),
      vehicleModel: String(data.get('vehicleModel') || ''),
    });
    setManuals((prev) => [manual, ...prev]);
  }

  async function createFromManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const guide = await webApi.createEnterpriseGuide({
      manualId: String(data.get('manualId')),
      vehicleModel: String(data.get('vehicleModel')),
      partName: String(data.get('partName')),
      oemNumber: String(data.get('oemNumber') || ''),
    });
    setGenerated(guide);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Enterprise Admin</h1>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <form onSubmit={uploadManual} className="card space-y-3 p-5">
          <h2 className="text-xl font-semibold">Upload manual</h2>
          <input name="title" required placeholder="Manual title" className="w-full rounded-xl border p-3" />
          <input name="fileUrl" required placeholder="PDF URL" className="w-full rounded-xl border p-3" />
          <input name="vehicleModel" placeholder="Vehicle model" className="w-full rounded-xl border p-3" />
          <textarea name="extractedText" placeholder="Extracted manual text" className="h-24 w-full rounded-xl border p-3" />
          <button className="btn-primary" type="submit">
            Save manual
          </button>
        </form>

        <form onSubmit={createFromManual} className="card space-y-3 p-5">
          <h2 className="text-xl font-semibold">Generate from manual</h2>
          <select name="manualId" required className="w-full rounded-xl border p-3">
            <option value="">Select manual</option>
            {manuals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <input name="vehicleModel" required placeholder="Vehicle model" className="w-full rounded-xl border p-3" />
          <input name="partName" required placeholder="Part name" className="w-full rounded-xl border p-3" />
          <input name="oemNumber" placeholder="OEM number" className="w-full rounded-xl border p-3" />
          <button className="btn-primary" type="submit">
            Generate guide
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-xl font-semibold">Manuals</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {manuals.map((m) => (
            <li key={m.id}>{m.title}</li>
          ))}
        </ul>
      </section>

      {generated && (
        <section className="card mt-8 p-5">
          <h2 className="text-xl font-semibold">Last generated guide</h2>
          <p className="mt-2 text-gray-700">{generated.title}</p>
        </section>
      )}
    </main>
  );
}

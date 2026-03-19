'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { ManualDocument, RepairGuide } from '@motixai/shared';
import { webApi } from '@/lib/api';

export default function EnterprisePage() {
  const [manuals, setManuals]       = useState<ManualDocument[]>([]);
  const [generated, setGenerated]   = useState<RepairGuide | null>(null);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [genError, setGenError]         = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    webApi.listManuals().then(setManuals).catch(() => setManuals([]));
  }, []);

  async function uploadManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUploadError(null);
    setUploading(true);
    try {
      const data = new FormData(form);
      const manual = await webApi.uploadManual({
        title: String(data.get('title')),
        fileUrl: String(data.get('fileUrl')),
        extractedText: String(data.get('extractedText') || ''),
        vehicleModel: String(data.get('vehicleModel') || ''),
      });
      setManuals((prev) => [manual, ...prev]);
      form.reset();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function createFromManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setGenError(null);
    setGenerating(true);
    try {
      const data = new FormData(form);
      const guide = await webApi.createEnterpriseGuide({
        manualId: String(data.get('manualId')),
        vehicleModel: String(data.get('vehicleModel')),
        partName: String(data.get('partName')),
        oemNumber: String(data.get('oemNumber') || ''),
      });
      setGenerated(guide);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <Link href="/" className="dash-logo">Motixi</Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="dash-nav-link">Repair Guides</Link>
          <button
            className="dash-nav-link dash-nav-link--logout"
            onClick={() => { localStorage.removeItem('motix_access_token'); location.href = '/auth/login'; }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">Enterprise Admin</h1>
            <p className="dash-page-sub">Upload manuals and generate guides from your own documentation.</p>
          </div>
          <span className="dash-guide-count">{manuals.length} manual{manuals.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="ent-grid">
          <form onSubmit={uploadManual} className="gen-form">
            <div className="gen-form-header">
              <div className="gen-form-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 12V4M6 7l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="gen-form-title">Upload manual</span>
            </div>
            <div className="gen-inputs gen-inputs--col">
              <div className="gen-input-wrap">
                <label className="gen-label">Manual title <span className="gen-label-required">*</span></label>
                <input name="title" required placeholder="e.g. CAT 320D Service Manual" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">PDF URL <span className="gen-label-required">*</span></label>
                <input name="fileUrl" required placeholder="https://example.com/manual.pdf" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Vehicle model <span className="gen-label-or">optional</span></label>
                <input name="vehicleModel" placeholder="e.g. CAT 320D" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Extracted text <span className="gen-label-or">optional</span></label>
                <textarea name="extractedText" placeholder="Paste relevant manual text here..." className="gen-input gen-input--textarea" rows={4} />
              </div>
            </div>
            {uploadError && (
              <div className="dash-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4.5v2.5M7 9v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {uploadError}
              </div>
            )}
            <button type="submit" disabled={uploading} className="gen-btn">
              {uploading ? <><span className="gen-spinner" /> Saving...</> : 'Save manual'}
            </button>
          </form>

          <form onSubmit={createFromManual} className="gen-form">
            <div className="gen-form-header">
              <div className="gen-form-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="gen-form-title">Generate from manual</span>
            </div>
            <div className="gen-inputs gen-inputs--col">
              <div className="gen-input-wrap">
                <label className="gen-label">Manual <span className="gen-label-required">*</span></label>
                <select name="manualId" required className="gen-input gen-input--select">
                  <option value="">Select manual...</option>
                  {manuals.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Vehicle model <span className="gen-label-required">*</span></label>
                <input name="vehicleModel" required placeholder="e.g. CAT 320D" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Part name <span className="gen-label-required">*</span></label>
                <input name="partName" required placeholder="e.g. Hydraulic Pump" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">OEM number <span className="gen-label-or">optional</span></label>
                <input name="oemNumber" placeholder="e.g. 4633891" className="gen-input" />
              </div>
            </div>
            {genError && (
              <div className="dash-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4.5v2.5M7 9v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {genError}
              </div>
            )}
            <button type="submit" disabled={generating} className="gen-btn">
              {generating ? <><span className="gen-spinner" /> Generating...</> : <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Generate guide
              </>}
            </button>
            {generated && (
              <Link href={`/guides/${generated.id}`} className="ent-generated-link">
                Guide ready: {generated.title} →
              </Link>
            )}
          </form>
        </div>

        <section className="guide-list" style={{ marginTop: 8 }}>
          <p className="ent-section-title">Manuals</p>
          {manuals.length === 0 ? (
            <div className="guide-list-empty">
              <div className="guide-empty-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="guide-empty-title">No manuals uploaded</p>
              <p className="guide-empty-sub">Upload a manual above to get started.</p>
            </div>
          ) : (
            manuals.map((m) => (
              <div key={m.id} className="guide-card">
                <div className="guide-card-main">
                  <div className="guide-card-meta">
                    <span className="badge badge--green">Manual</span>
                    <span className="guide-card-time">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="guide-card-title">{m.title}</h2>
                  <p className="guide-card-sub">{m.fileUrl}</p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

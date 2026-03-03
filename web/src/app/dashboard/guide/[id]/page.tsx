'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import apiClient from '@/lib/apiClient';
import {
  Clock, Wrench, Shield, AlertTriangle, CheckCircle2,
  Loader2, Heart, ChevronLeft, Video, FileText, ListOrdered
} from 'lucide-react';
import Link from 'next/link';

interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  warning?: string;
}

interface Guide {
  id: string;
  title: string;
  status: string;
  difficulty?: string;
  estimatedTime?: string;
  safetyNotes: string[];
  tools: string[];
  materials: string[];
  oemSummary?: string;
  steps: GuideStep[];
  vehicle: { make: string; model: string; year?: number };
  part: { name: string; oemNumber?: string };
}

type Tab = 'steps' | 'oem' | 'video';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'badge-green',
  medium: 'badge-yellow',
  hard: 'badge-red',
};

export default function GuidePage() {
  const params = useParams();
  const id = params.id as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('steps');
  const [favorited, setFavorited] = useState(false);

  const fetchGuide = useCallback(async () => {
    const res = await apiClient.get(`/guides/${id}`);
    return res.data.data as Guide;
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const load = async () => {
      try {
        const g = await fetchGuide();
        setGuide(g);
        setLoading(false);

        if (g.status === 'pending' || g.status === 'generating') {
          setPolling(true);
          interval = setInterval(async () => {
            const updated = await fetchGuide();
            setGuide(updated);
            if (updated.status === 'ready' || updated.status === 'failed') {
              clearInterval(interval);
              setPolling(false);
            }
          }, 2000);
        }
      } catch {
        setLoading(false);
      }
    };

    load();
    return () => clearInterval(interval);
  }, [fetchGuide]);

  const toggleFavorite = async () => {
    if (favorited) {
      await apiClient.delete(`/favorites/${id}`);
    } else {
      await apiClient.post('/favorites', { guideId: id });
    }
    setFavorited(!favorited);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-motix-500" />
        </div>
      </DashboardShell>
    );
  }

  if (!guide) {
    return (
      <DashboardShell>
        <div className="text-center py-16">
          <p className="text-neutral-500">Guide not found.</p>
          <Link href="/dashboard/search" className="btn-primary mt-4">New search</Link>
        </div>
      </DashboardShell>
    );
  }

  const isGenerating = guide.status === 'pending' || guide.status === 'generating';

  return (
    <DashboardShell>
      {/* Back */}
      <Link href="/dashboard/search" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Back to search
      </Link>

      {/* Generating state */}
      {isGenerating && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-motix-200 bg-motix-50 px-6 py-5">
          <Loader2 className="h-6 w-6 animate-spin text-motix-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-neutral-900">Generating your repair guide…</p>
            <p className="text-sm text-neutral-500">AI is analysing the vehicle and part. Usually under 30 seconds.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-neutral-500">
            {guide.vehicle.make} {guide.vehicle.model} {guide.vehicle.year ?? ''} · {guide.part.name}
            {guide.part.oemNumber && <span className="ml-2 font-mono text-xs">OEM: {guide.part.oemNumber}</span>}
          </p>
          <h1 className="text-2xl font-bold text-neutral-900">{guide.title}</h1>

          {guide.status === 'ready' && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-600">
              {guide.difficulty && (
                <span className={DIFFICULTY_COLOR[guide.difficulty]}>{guide.difficulty}</span>
              )}
              {guide.estimatedTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-neutral-400" /> {guide.estimatedTime}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <ListOrdered className="h-4 w-4 text-neutral-400" /> {guide.steps.length} steps
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleFavorite}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            favorited
              ? 'border-motix-200 bg-motix-50 text-motix-600'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          {favorited ? 'Saved' : 'Save'}
        </button>
      </div>

      {guide.status === 'ready' && (
        <>
          {/* Safety notes */}
          {guide.safetyNotes.length > 0 && (
            <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-800">Safety warnings</p>
              </div>
              <ul className="space-y-1">
                {guide.safetyNotes.map((note, i) => (
                  <li key={i} className="text-sm text-yellow-700">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tools + Materials */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {guide.tools.length > 0 && (
              <div className="card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-neutral-400" />
                  <p className="text-sm font-semibold text-neutral-700">Required tools</p>
                </div>
                <ul className="space-y-1">
                  {guide.tools.map((tool, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-motix-400 flex-shrink-0" /> {tool}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide.materials.length > 0 && (
              <div className="card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-neutral-400" />
                  <p className="text-sm font-semibold text-neutral-700">Parts & materials</p>
                </div>
                <ul className="space-y-1">
                  {guide.materials.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-motix-400 flex-shrink-0" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="flex gap-0">
              {([
                { id: 'steps', label: 'Step-by-step', icon: ListOrdered },
                { id: 'oem', label: 'OEM Summary', icon: FileText },
                { id: 'video', label: 'Video guide', icon: Video },
              ] as { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tabId
                      ? 'border-motix-500 text-motix-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {/* Steps tab */}
            {activeTab === 'steps' && (
              <div className="space-y-4">
                {guide.steps.map((step) => (
                  <div key={step.id} className="card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-motix-500 text-sm font-bold text-white">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-2 font-semibold text-neutral-900">{step.title}</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">{step.description}</p>
                        {step.warning && (
                          <div className="mt-3 flex items-start gap-2 rounded-md bg-yellow-50 px-3 py-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                            <p className="text-sm text-yellow-700">{step.warning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* OEM tab */}
            {activeTab === 'oem' && (
              <div className="card p-6">
                <h3 className="mb-4 font-semibold text-neutral-900">OEM Part Specification</h3>
                {guide.oemSummary ? (
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{guide.oemSummary}</p>
                ) : (
                  <p className="text-sm text-neutral-400">No OEM summary available.</p>
                )}
                {guide.part.oemNumber && (
                  <div className="mt-4 rounded-md bg-neutral-50 px-4 py-3">
                    <p className="text-xs text-neutral-500">OEM Part Number</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-neutral-900">{guide.part.oemNumber}</p>
                  </div>
                )}
              </div>
            )}

            {/* Video tab */}
            {activeTab === 'video' && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-16 text-center">
                <Video className="mb-4 h-12 w-12 text-neutral-300" />
                <h3 className="mb-1 font-semibold text-neutral-700">Video guides coming soon</h3>
                <p className="max-w-sm text-sm text-neutral-400">
                  We&apos;re working on AI-generated video walkthroughs for repair guides.
                  You&apos;ll be notified when this feature launches.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {guide.status === 'failed' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">Guide generation failed</p>
          <p className="mt-1 text-sm text-red-500">Please try again with a different search.</p>
          <Link href="/dashboard/search" className="btn-primary mt-4">Try again</Link>
        </div>
      )}
    </DashboardShell>
  );
}

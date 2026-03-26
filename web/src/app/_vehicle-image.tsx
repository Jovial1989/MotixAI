'use client';

import { useEffect, useRef, useState } from 'react';
import { webApi } from '@/lib/api';

function detectVehicleType(model: string | undefined | null): 'suv' | 'truck' | 'van' | 'sedan' {
  if (!model) return 'sedan';
  const m = model.toLowerCase();
  if (/suv|land cruiser|4runner|rav4|qashqai|x3|x5|x7|tucson|sportage|cx-|tiguan|escape|explorer|cherokee|wrangler|outlander|forester|pilot|highlander|tahoe|suburban|blazer|bronco|defender|range rover|discovery|cayenne|q[357]|glc|gle|gls|xc[469]0/i.test(m)) return 'suv';
  if (/truck|pickup|f-150|f150|f-250|silverado|ram|tundra|tacoma|ranger|colorado|frontier|titan|ridgeline|maverick|gladiator|hilux|navara|amarok|l200|triton/i.test(m)) return 'truck';
  if (/van|transit|sprinter|metris|promaster|express|savana|caravan|sienna|odyssey|pacifica|carnival|staria|transporter|crafter|vito|ducato/i.test(m)) return 'van';
  return 'sedan';
}

const vehicleImageRequests = new Map<string, Promise<string | null>>();
const vehicleImageResults = new Map<string, string>();

export default function VehicleImage({
  vehicleId,
  imageUrl,
  model,
  wrapperClassName = 'gcard-vehicle-icon',
  imageClassName = 'gcard-vehicle-img',
  svgClassName = 'gcard-vehicle-svg',
  alt,
}: {
  vehicleId?: string;
  imageUrl?: string | null;
  model?: string | null;
  wrapperClassName?: string;
  imageClassName?: string;
  svgClassName?: string;
  alt?: string;
}) {
  const cachedUrl = vehicleId ? vehicleImageResults.get(vehicleId) ?? imageUrl ?? null : imageUrl ?? null;
  const [src, setSrc] = useState<string | null>(cachedUrl);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(Boolean(cachedUrl));
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cachedUrl) {
      setIsVisible(true);
      return;
    }
    const node = wrapperRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '180px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cachedUrl]);

  useEffect(() => {
    if (vehicleId && imageUrl) vehicleImageResults.set(vehicleId, imageUrl);
    setSrc(vehicleId ? vehicleImageResults.get(vehicleId) ?? imageUrl ?? null : imageUrl ?? null);
  }, [vehicleId, imageUrl]);

  useEffect(() => {
    if (!vehicleId || src || loading || !isVisible) return;
    const existing = vehicleImageRequests.get(vehicleId);
    if (existing) {
      existing.then((url) => {
        if (url) {
          vehicleImageResults.set(vehicleId, url);
          setSrc(url);
        }
      });
      return;
    }

    setLoading(true);
    const promise = webApi.generateVehicleImage(vehicleId)
      .then((res) => {
        vehicleImageResults.set(vehicleId, res.imageUrl);
        setSrc(res.imageUrl);
        return res.imageUrl;
      })
      .catch(() => null)
      .finally(() => {
        setLoading(false);
        vehicleImageRequests.delete(vehicleId);
      });
    vehicleImageRequests.set(vehicleId, promise);
  }, [isVisible, loading, src, vehicleId]);

  if (src) {
    return (
      <div className={wrapperClassName} ref={wrapperRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? model ?? 'Vehicle'} className={imageClassName} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={wrapperClassName} ref={wrapperRef}>
        <span className="gen-spinner" />
      </div>
    );
  }

  const type = detectVehicleType(model);
  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      <svg viewBox="0 0 48 28" fill="none" className={svgClassName}>
        {type === 'suv' ? (
          <>
            <path d="M6 20h36M8 20l3-8h10l2 3h10l3-3h4l2 8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="14" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="36" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : type === 'truck' ? (
          <>
            <path d="M4 20h40M6 20l2-6h14v6M22 14h8l4 6h6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="12" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="38" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : type === 'van' ? (
          <>
            <path d="M5 20h38M7 20V10a2 2 0 012-2h18v12M27 8h6l4 5v7h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="13" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="37" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : (
          <>
            <path d="M5 20h38M8 20l2-5h6l3-5h10l3 5h6l2 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="13" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="37" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        )}
      </svg>
    </div>
  );
}

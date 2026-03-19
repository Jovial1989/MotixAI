'use client';

import { useState } from 'react';

interface FounderImageProps {
  size?: 'lg' | 'sm';
  className?: string;
}

export default function FounderImage({ size = 'lg' }: FounderImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={size === 'lg' ? 'founder-initials' : 'contact-v2-initials'}>
        KP
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/founder.jpg"
      alt="Kyrylo Petrov"
      className={size === 'lg' ? 'founder-img' : 'contact-v2-img'}
      onError={() => setFailed(true)}
    />
  );
}

'use client';
// src/components/TrackedButton.tsx
// FST-AN-001C: Client-side CTA button that fires cta_clicked analytics event.
// Drop-in replacement for Chakra Button where click tracking is needed.
import { Button, type ButtonProps } from '@chakra-ui/react';
import { track } from '@/lib/analytics';

interface TrackedButtonProps extends ButtonProps {
  ctaLabel: string;
  ctaHref?: string;
}

export function TrackedButton({ ctaLabel, ctaHref, onClick, ...props }: TrackedButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    track('cta_clicked', { cta_label: ctaLabel, cta_href: ctaHref || '' });
    if (onClick) onClick(e);
  }
  return <Button onClick={handleClick} {...props} />;
}

import React from 'react';

interface AuthIllustrationProps {
  side: 'left' | 'right';
}

/**
 * Native fallback for web-only editorial auth illustrations.
 */
export default function AuthIllustration(_props: AuthIllustrationProps) {
  return null;
}

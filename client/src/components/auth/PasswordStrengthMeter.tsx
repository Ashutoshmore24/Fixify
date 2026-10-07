import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: '', color: 'bg-muted' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalized to 0-4
  const normalizedScore = Math.min(4, Math.max(1, score - (password.length < 8 ? 1 : 0)));

  if (password.length < 8) {
    return { score: 1, label: 'Too short (min 8 chars)', color: 'bg-destructive' };
  }

  switch (normalizedScore) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-destructive' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', color: 'bg-blue-500' };
    case 4:
      return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    default:
      return { score: 1, label: 'Weak', color: 'bg-destructive' };
  }
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const { score, label, color } = calculatePasswordStrength(password);

  return (
    <div className="space-y-1.5 pt-1" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-semibold text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-colors duration-200 ${
              step <= score ? color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Must be at least 8 characters. Combine uppercase, lowercase, numbers & symbols.
      </p>
    </div>
  );
};

'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'Empty' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { score, label } = getPasswordStrength(password);
  const activeBars = password ? Math.max(1, score) : 0;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded ${index < activeBars
              ? score <= 1
                ? 'bg-red-500'
                : score === 2
                  ? 'bg-amber-500'
                  : score === 3
                    ? 'bg-blue-500'
                    : 'bg-green-500'
              : 'bg-gray-200'
              }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-600">Password strength: {label}</p>
    </div>
  );
}

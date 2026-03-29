export function EddieAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#B8D4C8" />
      {/* Shoulders — business casual */}
      <path d="M12,80 Q12,62 40,62 Q68,62 68,80Z" fill="#5C7A6E" />
      {/* Neck */}
      <rect x="35" y="54" width="10" height="10" fill="#D4956A" />
      {/* Ears */}
      <ellipse cx="20" cy="38" rx="4" ry="5" fill="#D4956A" />
      <ellipse cx="60" cy="38" rx="4" ry="5" fill="#D4956A" />
      {/* Face */}
      <ellipse cx="40" cy="38" rx="20" ry="22" fill="#DDA070" />
      {/* Hair — dark brown */}
      <path d="M20,30 Q21,8 40,8 Q59,8 60,30 Q56,14 40,14 Q24,14 20,30Z" fill="#3C2415" />
      {/* Eyebrows — strong */}
      <path d="M29,29 Q33,26 37,28" stroke="#3C2415" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M43,28 Q47,26 51,29" stroke="#3C2415" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="33" cy="35" rx="3.5" ry="3" fill="#3C2415" />
      <ellipse cx="47" cy="35" rx="3.5" ry="3" fill="#3C2415" />
      {/* Eye shine */}
      <circle cx="34.5" cy="34" r="1" fill="white" />
      <circle cx="48.5" cy="34" r="1" fill="white" />
      {/* Nose */}
      <circle cx="40" cy="41" r="1.8" fill="#C07850" />
      {/* Stubble */}
      <circle cx="33" cy="46" r="1" fill="#9A6843" opacity="0.6" />
      <circle cx="37" cy="48" r="1" fill="#9A6843" opacity="0.6" />
      <circle cx="41" cy="49" r="1" fill="#9A6843" opacity="0.5" />
      <circle cx="45" cy="48" r="1" fill="#9A6843" opacity="0.6" />
      <circle cx="47" cy="46" r="1" fill="#9A6843" opacity="0.6" />
      <circle cx="35" cy="44" r="0.8" fill="#9A6843" opacity="0.5" />
      <circle cx="44" cy="44" r="0.8" fill="#9A6843" opacity="0.5" />
      {/* Smile */}
      <path d="M34,44 Q40,50 46,44" stroke="#A85C3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

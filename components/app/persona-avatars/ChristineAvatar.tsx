export function ChristineAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#A8D5E2" />
      {/* Shoulders — formal */}
      <path d="M12,80 Q12,62 40,62 Q68,62 68,80Z" fill="#2E4057" />
      {/* Collar */}
      <path d="M33,62 L40,70 L47,62" fill="white" />
      {/* Neck */}
      <rect x="35" y="54" width="10" height="10" fill="#EFBF9A" />
      {/* Ears */}
      <ellipse cx="20" cy="38" rx="4" ry="5" fill="#EFBF9A" />
      <ellipse cx="60" cy="38" rx="4" ry="5" fill="#EFBF9A" />
      {/* Face */}
      <ellipse cx="40" cy="38" rx="20" ry="22" fill="#F5C9A0" />
      {/* Hair — dark, straight */}
      <path d="M20,32 Q20,10 40,10 Q60,10 60,32 Q56,16 40,16 Q24,16 20,32Z" fill="#2C2C2C" />
      <path d="M20,32 Q18,46 20,56 Q22,52 22,42Z" fill="#2C2C2C" />
      <path d="M60,32 Q62,46 60,56 Q58,52 58,42Z" fill="#2C2C2C" />
      {/* Eyebrows */}
      <path d="M29,29 Q33,27 37,28" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M43,28 Q47,27 51,29" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="33" cy="35" rx="3.5" ry="3" fill="#3C2415" />
      <ellipse cx="47" cy="35" rx="3.5" ry="3" fill="#3C2415" />
      {/* Eye shine */}
      <circle cx="34.5" cy="34" r="1" fill="white" />
      <circle cx="48.5" cy="34" r="1" fill="white" />
      {/* Glasses */}
      <rect x="28.5" y="31.5" width="10" height="7" rx="2" stroke="#4A6FA5" strokeWidth="1.5" fill="none" />
      <rect x="41.5" y="31.5" width="10" height="7" rx="2" stroke="#4A6FA5" strokeWidth="1.5" fill="none" />
      <line x1="38.5" y1="35" x2="41.5" y2="35" stroke="#4A6FA5" strokeWidth="1.5" />
      {/* Nose */}
      <circle cx="40" cy="41" r="1.5" fill="#DCA882" />
      {/* Smile */}
      <path d="M34,44 Q40,49 46,44" stroke="#C07A5A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

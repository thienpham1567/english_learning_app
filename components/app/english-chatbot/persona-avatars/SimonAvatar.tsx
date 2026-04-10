export function SimonAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#E8C96A" />
      {/* Shoulders */}
      <path d="M14,80 Q14,62 40,62 Q66,62 66,80Z" fill="#4A7BA7" />
      {/* Neck */}
      <rect x="35" y="54" width="10" height="10" fill="#F0B89A" />
      {/* Ears */}
      <ellipse cx="20" cy="38" rx="4" ry="5" fill="#F0B89A" />
      <ellipse cx="60" cy="38" rx="4" ry="5" fill="#F0B89A" />
      {/* Face */}
      <ellipse cx="40" cy="38" rx="20" ry="22" fill="#F5C5A3" />
      {/* Hair — blond, wavy */}
      <path d="M20,32 Q20,10 40,10 Q60,10 60,32 Q55,20 40,20 Q25,20 20,32Z" fill="#D4A843" />
      {/* Eyebrows */}
      <path
        d="M29,29 Q33,27 37,29"
        stroke="#B8902A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M43,29 Q47,27 51,29"
        stroke="#B8902A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <ellipse cx="33" cy="35" rx="3.5" ry="3" fill="#5B7FA6" />
      <ellipse cx="47" cy="35" rx="3.5" ry="3" fill="#5B7FA6" />
      {/* Eye shine */}
      <circle cx="34.5" cy="34" r="1" fill="white" />
      <circle cx="48.5" cy="34" r="1" fill="white" />
      {/* Nose */}
      <circle cx="40" cy="41" r="1.5" fill="#E0A882" />
      {/* Smile */}
      <path
        d="M33,44 Q40,51 47,44"
        stroke="#C47A5A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

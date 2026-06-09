export function AriaAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#C9B8E8" />
      {/* Shoulders — blazer */}
      <path d="M12,80 Q12,62 40,62 Q68,62 68,80Z" fill="#6D5BA6" />
      {/* Collar */}
      <path d="M34,62 L40,70 L46,62Z" fill="#EDE7F8" />
      {/* Neck */}
      <rect x="35" y="54" width="10" height="10" fill="#E8B894" />
      {/* Hair (back) */}
      <path
        d="M16,42 Q14,12 40,10 Q66,12 64,42 Q64,54 58,58 L58,34 Q40,22 22,34 L22,58 Q16,54 16,42Z"
        fill="#3A2A1E"
      />
      {/* Face */}
      <ellipse cx="40" cy="40" rx="19" ry="21" fill="#F0C29A" />
      {/* Bangs */}
      <path d="M22,30 Q24,16 40,15 Q56,16 58,30 Q50,22 40,22 Q30,22 22,30Z" fill="#3A2A1E" />
      {/* Eyebrows */}
      <path
        d="M29,33 Q33,31 37,33"
        stroke="#3A2A1E"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M43,33 Q47,31 51,33"
        stroke="#3A2A1E"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <ellipse cx="33" cy="38" rx="3.2" ry="3" fill="#2A1C12" />
      <ellipse cx="47" cy="38" rx="3.2" ry="3" fill="#2A1C12" />
      <circle cx="34.2" cy="37" r="1" fill="white" />
      <circle cx="48.2" cy="37" r="1" fill="white" />
      {/* Nose */}
      <path d="M40,40 L38.5,45 Q40,46 41.5,45Z" fill="#DCA277" />
      {/* Smile */}
      <path
        d="M34,48 Q40,53 46,48"
        stroke="#B5654A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Earrings */}
      <circle cx="21" cy="46" r="1.6" fill="#F2C84B" />
      <circle cx="59" cy="46" r="1.6" fill="#F2C84B" />
    </svg>
  );
}

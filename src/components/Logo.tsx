export function Logo({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      {/* Background circle for contrast */}
      <defs>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8C2C" />
        </linearGradient>
        <filter id="coinShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Five coins arranged in golden ratio ascending pattern */}
      
      {/* Coin 1 - Bottom Left (largest) - R = 24 */}
      <circle cx="55" cy="145" r="24" fill="url(#coinGradient)" filter="url(#coinShadow)" />
      <circle cx="55" cy="145" r="24" fill="none" stroke="#1F2937" strokeWidth="1.5" opacity="0.6" />
      <circle cx="55" cy="145" r="20" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.3" />
      <text x="55" y="150" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1F2937" opacity="0.5">✦</text>

      {/* Coin 2 - Bottom Right - R = 14.8 (÷1.618) */}
      <circle cx="135" cy="138" r="14.8" fill="url(#coinGradient)" filter="url(#coinShadow)" />
      <circle cx="135" cy="138" r="14.8" fill="none" stroke="#1F2937" strokeWidth="1" opacity="0.6" />
      <circle cx="135" cy="138" r="12" fill="none" stroke="#1F2937" strokeWidth="0.6" opacity="0.3" />

      {/* Coin 3 - Middle Center - R = 9.15 (÷1.618) */}
      <circle cx="100" cy="105" r="9.15" fill="url(#coinGradient)" filter="url(#coinShadow)" />
      <circle cx="100" cy="105" r="9.15" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.6" />
      <circle cx="100" cy="105" r="7.2" fill="none" stroke="#1F2937" strokeWidth="0.5" opacity="0.3" />

      {/* Coin 4 - Top Left - R = 5.65 (÷1.618) */}
      <circle cx="65" cy="70" r="5.65" fill="url(#coinGradient)" filter="url(#coinShadow)" />
      <circle cx="65" cy="70" r="5.65" fill="none" stroke="#1F2937" strokeWidth="0.6" opacity="0.6" />

      {/* Coin 5 - Top Right - R = 3.5 (÷1.618) */}
      <circle cx="130" cy="55" r="3.5" fill="url(#coinGradient)" filter="url(#coinShadow)" />
      <circle cx="130" cy="55" r="3.5" fill="none" stroke="#1F2937" strokeWidth="0.4" opacity="0.6" />

      {/* Ascending line connecting coins (subtle) */}
      <path
        d="M 55 145 Q 85 125, 100 105 T 130 55"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        opacity="0.2"
        strokeDasharray="3,2"
      />

      {/* Subtle text mark - optional minimal text */}
      <text
        x="100"
        y="190"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#1F2937"
        letterSpacing="2"
      >
        FIVE TALENTS
      </text>
    </svg>
  );
}

// Export a version without text for use as just an icon
export function LogoIcon({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8C2C" />
        </linearGradient>
        <filter id="coinShadow2">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Five coins only */}
      <circle cx="55" cy="145" r="24" fill="url(#coinGradient2)" filter="url(#coinShadow2)" />
      <circle cx="55" cy="145" r="24" fill="none" stroke="#1F2937" strokeWidth="1.5" opacity="0.6" />
      <circle cx="55" cy="145" r="20" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.3" />
      <text x="55" y="150" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1F2937" opacity="0.5">✦</text>

      <circle cx="135" cy="138" r="14.8" fill="url(#coinGradient2)" filter="url(#coinShadow2)" />
      <circle cx="135" cy="138" r="14.8" fill="none" stroke="#1F2937" strokeWidth="1" opacity="0.6" />
      <circle cx="135" cy="138" r="12" fill="none" stroke="#1F2937" strokeWidth="0.6" opacity="0.3" />

      <circle cx="100" cy="105" r="9.15" fill="url(#coinGradient2)" filter="url(#coinShadow2)" />
      <circle cx="100" cy="105" r="9.15" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.6" />
      <circle cx="100" cy="105" r="7.2" fill="none" stroke="#1F2937" strokeWidth="0.5" opacity="0.3" />

      <circle cx="65" cy="70" r="5.65" fill="url(#coinGradient2)" filter="url(#coinShadow2)" />
      <circle cx="65" cy="70" r="5.65" fill="none" stroke="#1F2937" strokeWidth="0.6" opacity="0.6" />

      <circle cx="130" cy="55" r="3.5" fill="url(#coinGradient2)" filter="url(#coinShadow2)" />
      <circle cx="130" cy="55" r="3.5" fill="none" stroke="#1F2937" strokeWidth="0.4" opacity="0.6" />

      <path
        d="M 55 145 Q 85 125, 100 105 T 130 55"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        opacity="0.2"
        strokeDasharray="3,2"
      />
    </svg>
  );
}

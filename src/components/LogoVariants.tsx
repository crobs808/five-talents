// Alternative Logo Design: Elegant hand + coins with golden ratio
export function LogoAlt({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6B800" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>

      {/* Open hand cupping */}
      <path
        d="M 70 90 Q 65 110, 70 130 Q 75 145, 85 150 Q 95 155, 105 155 Q 115 155, 120 150 Q 130 140, 135 125 Q 140 110, 138 90"
        fill="url(#handGradient)"
        opacity="0.85"
      />
      
      {/* Hand highlights */}
      <path
        d="M 75 100 Q 80 120, 85 140"
        fill="none"
        stroke="#F3F4F6"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Five coins in curved arrangement inside palm (using golden spiral proportions) */}
      
      {/* Coin 1 - Center largest */}
      <circle cx="100" cy="110" r="16" fill="url(#goldGradient)" />
      <circle cx="100" cy="110" r="16" fill="none" stroke="#1F2937" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="110" r="13" fill="none" stroke="#F3F4F6" strokeWidth="0.5" opacity="0.4" />

      {/* Coin 2 */}
      <circle cx="80" cy="95" r="9.9" fill="url(#goldGradient)" />
      <circle cx="80" cy="95" r="9.9" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.3" />

      {/* Coin 3 */}
      <circle cx="115" cy="85" r="6.1" fill="url(#goldGradient)" />
      <circle cx="115" cy="85" r="6.1" fill="none" stroke="#1F2937" strokeWidth="0.6" opacity="0.3" />

      {/* Coin 4 */}
      <circle cx="75" cy="125" r="3.75" fill="url(#goldGradient)" />
      <circle cx="75" cy="125" r="3.75" fill="none" stroke="#1F2937" strokeWidth="0.4" opacity="0.3" />

      {/* Coin 5 */}
      <circle cx="125" cy="120" r="2.3" fill="url(#goldGradient)" />
      <circle cx="125" cy="120" r="2.3" fill="none" stroke="#1F2937" strokeWidth="0.3" opacity="0.3" />

      {/* Subtle ascension line */}
      <path
        d="M 75 125 Q 85 115, 100 110 T 125 85"
        fill="none"
        stroke="#E6B800"
        strokeWidth="1"
        opacity="0.15"
        strokeDasharray="2,2"
      />

      {/* Text */}
      <text
        x="100"
        y="185"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#1F2937"
        letterSpacing="1.5"
      >
        FIVE TALENTS
      </text>
    </svg>
  );
}

// Minimalist version: Just the essential geometric form
export function LogoMinimal({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="minimalGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9D7E23" />
        </linearGradient>
      </defs>

      {/* Ascending staircase/growth pattern with 5 elements */}
      
      {/* Element 1 - Bottom Left (golden ratio base) */}
      <rect x="45" y="125" width="38.2" height="38.2" fill="url(#minimalGold)" rx="4" opacity="0.9" />
      
      {/* Element 2 */}
      <rect x="95" y="105" width="23.6" height="23.6" fill="url(#minimalGold)" rx="3" opacity="0.85" />
      
      {/* Element 3 */}
      <rect x="130" y="85" width="14.6" height="14.6" fill="url(#minimalGold)" rx="2" opacity="0.8" />
      
      {/* Element 4 */}
      <rect x="155" y="67" width="9" height="9" fill="url(#minimalGold)" rx="1.5" opacity="0.75" />
      
      {/* Element 5 - Top (accent) */}
      <rect x="172" y="52" width="5.5" height="5.5" fill="url(#minimalGold)" rx="1" opacity="0.7" />

      {/* Connecting line showing growth */}
      <path
        d="M 64 125 L 84 128 L 107 105 L 137 85 L 160 67 L 180 52"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        opacity="0.2"
      />

      {/* Text */}
      <text
        x="100"
        y="192"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#1F2937"
        letterSpacing="1.2"
      >
        FIVE TALENTS
      </text>
    </svg>
  );
}

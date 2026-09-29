"use client";

// Lexi, the tutor avatar: an original SVG fox with expressions and a
// lip-flap animation while speaking.

export type Mood = "idle" | "happy" | "encouraging" | "thinking" | "surprised" | "sad";

interface Props {
  mood?: Mood;
  talking?: boolean;
  size?: number;
}

export default function Avatar({ mood = "idle", talking = false, size = 140 }: Props) {
  const eyes = (() => {
    switch (mood) {
      case "happy":
        return (
          <g stroke="#2b1a10" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M70 108 q10 -12 20 0" />
            <path d="M110 108 q10 -12 20 0" />
          </g>
        );
      case "surprised":
        return (
          <g fill="#2b1a10">
            <circle cx="80" cy="104" r="9" />
            <circle cx="120" cy="104" r="9" />
            <circle cx="83" cy="100" r="3" fill="#fff" />
            <circle cx="123" cy="100" r="3" fill="#fff" />
          </g>
        );
      case "thinking":
        return (
          <g fill="#2b1a10">
            <ellipse cx="80" cy="102" rx="6" ry="7" />
            <ellipse cx="120" cy="102" rx="6" ry="7" />
            <circle cx="82" cy="99" r="2" fill="#fff" />
            <circle cx="122" cy="99" r="2" fill="#fff" />
            <path d="M70 88 l18 -4 M112 84 l18 4" stroke="#2b1a10" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case "sad":
        return (
          <g fill="#2b1a10">
            <ellipse cx="80" cy="106" rx="6" ry="7" />
            <ellipse cx="120" cy="106" rx="6" ry="7" />
            <path d="M68 92 l18 6 M114 98 l18 -6" stroke="#2b1a10" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      default:
        return (
          <g className="avatar-blink" fill="#2b1a10">
            <ellipse cx="80" cy="104" rx="7" ry="8" />
            <ellipse cx="120" cy="104" rx="7" ry="8" />
            <circle cx="83" cy="100" r="2.5" fill="#fff" />
            <circle cx="123" cy="100" r="2.5" fill="#fff" />
          </g>
        );
    }
  })();

  const mouth = talking ? (
    <ellipse className="avatar-talk" cx="100" cy="140" rx="9" ry="7" fill="#7a2e1d" />
  ) : mood === "sad" ? (
    <path d="M90 144 q10 -8 20 0" stroke="#2b1a10" strokeWidth="4" fill="none" strokeLinecap="round" />
  ) : mood === "surprised" ? (
    <ellipse cx="100" cy="141" rx="6" ry="7" fill="#7a2e1d" />
  ) : mood === "thinking" ? (
    <path d="M92 142 h16" stroke="#2b1a10" strokeWidth="4" strokeLinecap="round" />
  ) : (
    <path d="M88 136 q12 14 24 0" stroke="#2b1a10" strokeWidth="4" fill="#7a2e1d" strokeLinecap="round" />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Lexi, tu tutora (${mood})`}
      className={`avatar ${mood === "happy" ? "avatar-bounce" : "avatar-float"}`}
    >
      {/* ears */}
      <path d="M38 78 L52 18 L86 58 Z" fill="#f47c20" />
      <path d="M162 78 L148 18 L114 58 Z" fill="#f47c20" />
      <path d="M50 66 L56 34 L74 56 Z" fill="#2b1a10" opacity="0.8" />
      <path d="M150 66 L144 34 L126 56 Z" fill="#2b1a10" opacity="0.8" />
      {/* head */}
      <path d="M30 96 C30 52 170 52 170 96 C170 140 134 176 100 176 C66 176 30 140 30 96 Z" fill="#f7892b" />
      {/* cheeks / muzzle */}
      <path d="M44 112 C60 104 80 116 100 124 C120 116 140 104 156 112 C150 152 124 172 100 172 C76 172 50 152 44 112 Z" fill="#fff4e6" />
      {/* blush */}
      <ellipse cx="62" cy="128" rx="10" ry="6" fill="#ff9e9e" opacity={mood === "happy" || mood === "encouraging" ? 0.7 : 0.35} />
      <ellipse cx="138" cy="128" rx="10" ry="6" fill="#ff9e9e" opacity={mood === "happy" || mood === "encouraging" ? 0.7 : 0.35} />
      {eyes}
      {/* nose */}
      <ellipse cx="100" cy="124" rx="8" ry="6" fill="#2b1a10" />
      {mouth}
      {/* scarf, the brand touch */}
      <path d="M58 168 Q100 190 142 168 L146 182 Q100 204 54 182 Z" fill="#1cb0a0" />
    </svg>
  );
}

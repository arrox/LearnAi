"use client";

import Avatar, { type Mood } from "./Avatar";

interface Props {
  text: string;
  mood?: Mood;
  talking?: boolean;
  onSpeak?: () => void;
  size?: number;
}

/** The avatar with a speech bubble next to it; tapping the speaker reads the text aloud. */
export default function TutorBubble({ text, mood = "idle", talking, onSpeak, size = 110 }: Props) {
  return (
    <div className="flex items-end gap-3">
      <div className="shrink-0">
        <Avatar mood={mood} talking={talking} size={size} />
      </div>
      <div className="bubble relative mb-6 rounded-2xl border-2 border-line bg-surface px-4 py-3 text-base leading-snug">
        <p>{text}</p>
        {onSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            className="mt-2 text-sm font-bold text-accent"
            aria-label="Escuchar"
          >
            🔊 Escuchar
          </button>
        )}
      </div>
    </div>
  );
}

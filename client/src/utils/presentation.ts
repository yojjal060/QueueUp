export interface GamePresentation {
  label: string;
  shortLabel: string;
  accentClass: string;
  accentBorderClass: string;
  accentTextClass: string;
  heroBackgroundClass: string;
  mediaBackgroundClass: string;
}

const DEFAULT_PRESENTATION: GamePresentation = {
  label: "QueueUp Protocol",
  shortLabel: "Protocol",
  accentClass: "text-[#ffb59f]",
  accentBorderClass: "border-[#ffb59f]/25 bg-[#802a0d]/18",
  accentTextClass: "text-[#fff6ee]",
  heroBackgroundClass:
    "bg-[radial-gradient(circle_at_72%_28%,rgba(158,232,232,0.14),transparent_20%),radial-gradient(circle_at_80%_62%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(145deg,rgba(12,17,19,0.92),rgba(20,19,18,0.95)_42%,rgba(35,22,15,0.9))]",
  mediaBackgroundClass:
    "bg-[radial-gradient(circle_at_28%_28%,rgba(158,232,232,0.22),transparent_16%),radial-gradient(circle_at_76%_58%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(160deg,#0f1315,#151311_44%,#251812)]",
};

const GAME_PRESENTATIONS: Record<string, GamePresentation> = {
  PUBG_MOBILE: {
    label: "PUBG Battlegrounds",
    shortLabel: "PUBG",
    accentClass: "text-[#9ee8e8]",
    accentBorderClass: "border-[#9ee8e8]/22 bg-[#176a6b]/14",
    accentTextClass: "text-[#d9fffe]",
    heroBackgroundClass:
      "bg-[radial-gradient(circle_at_76%_22%,rgba(158,232,232,0.18),transparent_19%),radial-gradient(circle_at_70%_65%,rgba(255,181,159,0.16),transparent_23%),linear-gradient(145deg,rgba(8,19,23,0.94),rgba(17,24,28,0.96)_44%,rgba(33,20,13,0.92))]",
    mediaBackgroundClass:
      "bg-[radial-gradient(circle_at_24%_26%,rgba(138,211,211,0.24),transparent_18%),radial-gradient(circle_at_74%_58%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(160deg,#071116,#0e161c_46%,#24170f)]",
  },
  MARVEL_RIVALS: {
    label: "Marvel Rivals",
    shortLabel: "Marvel",
    accentClass: "text-[#ffb59f]",
    accentBorderClass: "border-[#ffb59f]/24 bg-[#802a0d]/16",
    accentTextClass: "text-[#fff6ee]",
    heroBackgroundClass:
      "bg-[radial-gradient(circle_at_70%_20%,rgba(158,232,232,0.16),transparent_18%),radial-gradient(circle_at_65%_56%,rgba(255,181,159,0.2),transparent_26%),linear-gradient(150deg,rgba(18,11,20,0.94),rgba(15,20,29,0.96)_42%,rgba(35,19,14,0.92))]",
    mediaBackgroundClass:
      "bg-[radial-gradient(circle_at_28%_24%,rgba(158,232,232,0.2),transparent_18%),radial-gradient(circle_at_76%_52%,rgba(255,181,159,0.2),transparent_24%),linear-gradient(160deg,#0f1320,#15111a_42%,#24150f)]",
  },
};

export function getGamePresentation(gameId?: string | null) {
  if (!gameId) {
    return DEFAULT_PRESENTATION;
  }

  return GAME_PRESENTATIONS[gameId] ?? DEFAULT_PRESENTATION;
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

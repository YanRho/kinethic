import type { CSSProperties } from "react";
import { Profile, initials } from "@/lib/kinethic/domain";
import { BackButton, HomeButton } from "./back-button";
import { Surface } from "@/components/kinethic-ui";

export function Brand() {
  return (
    <span className="text-xl font-semibold tracking-tight">
      Kin<span className="brand-accent">Ethic</span>
    </span>
  );
}

export function ProfileBadge({
  profile,
  size = "md",
}: {
  profile: Profile;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`flex ${size === "sm" ? "h-11 w-11" : "h-16 w-16"} items-center justify-center rounded-full bg-linear-to-br ${profile.accent} p-0.5`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#080b12] font-semibold text-white">
        {initials(profile.name)}
      </div>
    </div>
  );
}

export function PageShell({
  children,
  backHref,
  title,
  profile,
  backConfirmMessage,
  onBeforeBack,
}: {
  children: React.ReactNode;
  backHref?: string;
  title?: string;
  profile?: Profile;
  backConfirmMessage?: string;
  onBeforeBack?: () => void;
}) {
  return (
    <main
      className={`min-h-dvh bg-[#080b12] px-4 py-5 text-white sm:px-5 ${profile ? "profile-theme" : ""}`}
      style={profile ? getProfileThemeStyle(profile.accent) : undefined}
    >
      <div className="mx-auto max-w-5xl">
        <header className="flex min-h-12 items-center justify-between gap-3">
          {backHref ? (
            <div className="flex items-center gap-2">
              <BackButton
                fallbackHref={backHref}
                confirmMessage={backConfirmMessage}
                onBeforeBack={onBeforeBack}
              />
              <HomeButton
                href={profile ? `/today/${profile.id}` : "/"}
                confirmMessage={backConfirmMessage}
                onBeforeHome={onBeforeBack}
              />
            </div>
          ) : (
            <Brand />
          )}
          {title && (
            <p className="truncate text-sm font-semibold text-slate-300">
              {title}
            </p>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}

type ProfilePalette = {
  accent: string;
  accentStrong: string;
  background: string;
  panel: string;
  panelStrong: string;
  border: string;
  muted: string;
  primaryText: string;
};

const defaultPalette: ProfilePalette = {
  accent: "#38bdf8",
  accentStrong: "#60a5fa",
  background: "#06101e",
  panel: "#0c1929",
  panelStrong: "#102238",
  border: "#1f3956",
  muted: "#91a8c1",
  primaryText: "#03111d",
};

const profilePalettes: Record<string, ProfilePalette> = {
  "from-cyan-300 via-blue-400 to-indigo-500": defaultPalette,
  "from-rose-300 via-fuchsia-400 to-violet-500": {
    accent: "#e879f9",
    accentStrong: "#c084fc",
    background: "#150919",
    panel: "#211027",
    panelStrong: "#2b1533",
    border: "#4b2855",
    muted: "#c3a0c8",
    primaryText: "#1c0720",
  },
  "from-emerald-300 via-teal-400 to-cyan-500": {
    accent: "#34d399",
    accentStrong: "#2dd4bf",
    background: "#06140f",
    panel: "#0b2018",
    panelStrong: "#102a20",
    border: "#22503e",
    muted: "#91b8a9",
    primaryText: "#03150e",
  },
  "from-amber-200 via-orange-300 to-rose-400": {
    accent: "#fbbf24",
    accentStrong: "#fb923c",
    background: "#171005",
    panel: "#24190a",
    panelStrong: "#30210c",
    border: "#594019",
    muted: "#c7ad82",
    primaryText: "#1c1002",
  },
};

export function getProfileThemeStyle(accent: string): CSSProperties {
  const palette = profilePalettes[accent] ?? defaultPalette;

  return {
    "--profile-accent": palette.accent,
    "--profile-accent-strong": palette.accentStrong,
    "--profile-background": palette.background,
    "--profile-panel": palette.panel,
    "--profile-panel-strong": palette.panelStrong,
    "--profile-border": palette.border,
    "--profile-muted": palette.muted,
    "--profile-primary-text": palette.primaryText,
    "--profile-accent-soft": `color-mix(in srgb, ${palette.accent} 14%, transparent)`,
    "--profile-accent-border": `color-mix(in srgb, ${palette.accent} 48%, transparent)`,
  } as CSSProperties;
}

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Surface className="mt-8 p-6 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </Surface>
  );
}

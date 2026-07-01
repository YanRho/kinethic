"use client";

import { useState } from "react";
import Image from "next/image";

type Profile = {
  id: "bryan" | "darian";
  name: string;
  initials: string;
  avatarUrl: string;
  accent: string;
};

const profiles: Profile[] = [
  {
    id: "bryan",
    name: "Bryan",
    initials: "B",
    avatarUrl: "/avatars/bryan.jpg",
    accent: "from-cyan-300 via-blue-400 to-indigo-500",
  },
  {
    id: "darian",
    name: "Darian",
    initials: "D",
    avatarUrl: "/avatars/darian.jpg",
    accent: "from-rose-300 via-fuchsia-400 to-violet-500",
  },
];

function ProfileAvatar({ profile }: { profile: Profile }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={`h-28 w-28 overflow-hidden rounded-full bg-linear-to-br ${profile.accent} p-0.75 shadow-lg shadow-black/30 sm:h-36 sm:w-36`}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-950">
        {!imageFailed ? (
          <Image
            src={profile.avatarUrl}
            alt={`${profile.name}'s profile`}
            className="h-full w-full object-cover"
            width={144}
            height={144}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-3xl font-semibold text-white sm:text-4xl">
            {profile.initials}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const handleProfileSelect = (profileId: Profile["id"]) => {
    console.log(`Selected profile: ${profileId}`);

    // Later this will route to something like:
    // router.push(`/today/${profileId}`);
  };

  return (
    <main className="min-h-dvh bg-[#080b12] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <header className="pt-3 text-center">
          <p className="text-2xl font-semibold tracking-tight">
            Kin<span className="text-cyan-300">Ethic</span>
          </p>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center pb-16">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Who&apos;s training today?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Choose your profile to continue.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-5">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className="group flex min-h-52 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-7 transition active:scale-[0.98] hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-[#080b12]"
              >
                <div className="transition duration-200 group-hover:scale-105">
                  <ProfileAvatar profile={profile} />
                </div>

                <span className="mt-5 text-lg font-semibold tracking-tight">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-600">
          KinEthic · Train with intention. Track with consistency.
        </footer>
      </div>
    </main>
  );
}
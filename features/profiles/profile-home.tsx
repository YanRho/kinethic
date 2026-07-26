"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBadge } from "@/app/_components/ui";
import {
  useKinEthicData,
  useKinEthicHydrated,
} from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";

const accents = [
  "from-cyan-300 via-blue-400 to-indigo-500",
  "from-rose-300 via-fuchsia-400 to-violet-500",
  "from-emerald-300 via-teal-400 to-cyan-500",
  "from-amber-200 via-orange-300 to-rose-400",
];

export function ProfileHome() {
  const data = useKinEthicData();
  const hydrated = useKinEthicHydrated();
  const profiles = Object.values(data.profiles);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(accents[0]);
  const showingCreator = creating || profiles.length === 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const profile = repository.createProfile({ name, accent });
    router.replace(`/profiles/${profile.id}/splits/new`);
  };
  return (
    <main className="min-h-dvh bg-[#080b12] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-2xl flex-col">
        <header className="pt-3 text-center text-2xl font-semibold">
          Kin<span className="text-cyan-300">Ethic</span>
        </header>
        <section className="flex flex-1 items-center py-10">
          {!hydrated ? (
            <div
              aria-busy="true"
              aria-label="Loading local profiles"
              className="w-full text-center text-sm text-slate-400"
            >
              Loading profiles…
            </div>
          ) : !showingCreator ? (
            <div className="w-full text-center">
              <h1 className="text-3xl font-semibold">
                Who&apos;s training today?
              </h1>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => router.push(`/today/${profile.id}`)}
                    className="panel flex min-h-44 flex-col items-center justify-center p-4 transition hover:border-white/20 hover:bg-white/7"
                  >
                    <ProfileBadge profile={profile} />
                    <span className="mt-4 font-semibold">{profile.name}</span>
                    <span className="mt-1 text-xs text-slate-500">
                      {profile.activeSplitId
                        ? (data.splits[profile.activeSplitId]?.name ??
                          "Set up split")
                        : "Set up split"}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setAccent(accents[profiles.length % accents.length]);
                    setCreating(true);
                  }}
                  className="panel flex min-h-44 flex-col items-center justify-center border-dashed p-4 text-slate-300"
                >
                  <span className="text-4xl font-light">+</span>
                  <span className="mt-4 font-semibold">Add profile</span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="panel mx-auto w-full max-w-md p-6"
            >
              <h1 className="text-2xl font-semibold">Create a local profile</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This profile and its workout data stay in this browser.
              </p>
              <label className="field mt-6">
                <span>Name</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name"
                />
              </label>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-300">
                  Profile color
                </p>
                <div className="mt-3 flex gap-3">
                  {accents.map((option) => (
                    <button
                      aria-label="Choose profile color"
                      type="button"
                      key={option}
                      onClick={() => setAccent(option)}
                      className={`h-11 w-11 rounded-full bg-linear-to-br ${option} ${accent === option ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#080b12]" : "opacity-70"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-7 grid gap-3">
                <button className="primary-button" type="submit">
                  Create profile
                </button>
                {profiles.length > 0 && (
                  <button
                    className="muted-button"
                    type="button"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

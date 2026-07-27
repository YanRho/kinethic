"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBadge } from "@/app/_components/ui";
import { useKinEthicData, useKinEthicHydrated } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { Gender } from "@/lib/kinethic/domain";
import { ActionButton, AppInput } from "@/components/kinethic-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");
  const [weightLb, setWeightLb] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [accent, setAccent] = useState(accents[0]);
  const showingCreator = creating || profiles.length === 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAge = Number(age);
    const parsedWeight = Number(weightLb);
    const parsedFeet = Number(heightFeet);
    const parsedInches = Number(heightInches);
    if (
      !name.trim() ||
      !Number.isInteger(parsedAge) ||
      parsedAge < 13 ||
      parsedAge > 120 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      parsedWeight > 1500 ||
      !Number.isInteger(parsedFeet) ||
      parsedFeet < 1 ||
      parsedFeet > 8 ||
      !Number.isInteger(parsedInches) ||
      parsedInches < 0 ||
      parsedInches > 11
    ) {
      return;
    }
    const profile = repository.createProfile({
      name,
      accent,
      age: parsedAge,
      gender,
      weightLb: parsedWeight,
      heightIn: parsedFeet * 12 + parsedInches,
    });
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
                  <ActionButton
                    tone="ghost"
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
                  </ActionButton>
                ))}
                <ActionButton
                  tone="ghost"
                  onClick={() => {
                    setAccent(accents[profiles.length % accents.length]);
                    setCreating(true);
                  }}
                  className="panel flex min-h-44 flex-col items-center justify-center border-dashed p-4 text-slate-300"
                >
                  <span className="text-4xl font-light">+</span>
                  <span className="mt-4 font-semibold">Add profile</span>
                </ActionButton>
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
                <AppInput
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name"
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>Age</span>
                  <AppInput
                    required
                    type="number"
                    min="13"
                    max="120"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                  />
                </label>
                <label className="field">
                  <span>Gender</span>
                  <Select
                    value={gender}
                    onValueChange={(value) => setGender(value as Gender)}
                  >
                    <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-white/10 bg-[#080b12]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="woman">Woman</SelectItem>
                      <SelectItem value="man">Man</SelectItem>
                      <SelectItem value="nonbinary">Non-binary</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="field mt-4">
                <span>Weight (lb)</span>
                <AppInput
                  required
                  type="number"
                  min="1"
                  max="1500"
                  step="0.1"
                  inputMode="decimal"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  placeholder="Weight"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-slate-300">
                  Height
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="field">
                    <span className="sr-only">Height in feet</span>
                    <AppInput
                      required
                      type="number"
                      min="1"
                      max="8"
                      inputMode="numeric"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="Feet"
                    />
                  </label>
                  <label className="field">
                    <span className="sr-only">Additional height in inches</span>
                    <AppInput
                      required
                      type="number"
                      min="0"
                      max="11"
                      inputMode="numeric"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="Inches"
                    />
                  </label>
                </div>
              </fieldset>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-300">
                  Profile color
                </p>
                <div className="mt-3 flex gap-3">
                  {accents.map((option) => (
                    <ActionButton
                      tone="ghost"
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
                <ActionButton tone="primary" type="submit">
                  Create profile
                </ActionButton>
                {profiles.length > 0 && (
                  <ActionButton
                    type="button"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </ActionButton>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

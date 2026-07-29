"use client";

import { useState } from "react";
import {
  SessionExercise,
  SessionSet,
  TrackingType,
} from "@/lib/kinethic/domain";
import { ActionButton, AppInput } from "@/components/kinethic-ui";

export type ExerciseLoggerProps = {
  exercise: SessionExercise;
  restSeconds: number;
  onUpdateSet(setNumber: number, changes: Partial<SessionSet>): void;
  onCompleteSet(setNumber: number): void;
  onWorkingWeightChange(weight?: number): void;
};

function NumberInput({
  label,
  value,
  disabled,
  step,
  inputMode = "numeric",
  onChange,
}: {
  label: string;
  value?: number;
  disabled?: boolean;
  step?: number;
  inputMode?: "numeric" | "decimal";
  onChange(value?: number): void;
}) {
  return (
    <label className="field text-xs sm:text-sm">
      <span>{label}</span>
      <AppInput
        className="mt-1.5 min-h-11 rounded-xl px-3 py-2 text-base sm:mt-2 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3"
        disabled={disabled}
        inputMode={inputMode}
        min="0"
        step={step}
        type="number"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
      />
    </label>
  );
}

function SetContainer({
  exercise,
  restSeconds,
  isValid,
  children,
  onCompleteSet,
}: Pick<ExerciseLoggerProps, "exercise" | "restSeconds" | "onCompleteSet"> & {
  isValid(set: SessionSet): boolean;
  children(set: SessionSet, inputsDisabled: boolean): React.ReactNode;
}) {
  const nextSet = exercise.sets.find((set) => !set.completedAt);
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
      {exercise.sets.map((set) => {
        const isComplete = Boolean(set.completedAt);
        const isNext = set.setNumber === nextSet?.setNumber;
        const isEditing = editingSetNumber === set.setNumber;
        const inputsDisabled =
          restSeconds > 0 ||
          (!isNext && !isEditing) ||
          (isComplete && !isEditing);

        return (
          <div
            className={`rounded-xl border p-3 sm:rounded-2xl ${isNext ? "theme-accent-surface" : "border-white/10 bg-black/15"}`}
            key={set.setNumber}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Set {set.setNumber}</p>
              {isComplete ? (
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <span
                      aria-label="Set completed"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-300/10 text-sm font-bold text-emerald-300"
                      role="img"
                    >
                      ✓
                    </span>
                  )}
                  {isEditing ? (
                    <ActionButton
                      tone="ghost"
                      type="button"
                      aria-label="Save set correction"
                      title="Save correction"
                      className="flex h-10 min-h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-lg font-bold text-white/80 transition hover:border-emerald-300/50 hover:bg-emerald-300 hover:text-emerald-950 focus-visible:border-emerald-300/50 focus-visible:bg-emerald-300 focus-visible:text-emerald-950 focus-visible:outline-none"
                      onClick={() => setEditingSetNumber(null)}
                    >
                      ✓
                    </ActionButton>
                  ) : (
                    <ActionButton
                      type="button"
                      aria-label="Edit completed set"
                      title="Edit completed set"
                      className="h-10 min-h-10 w-10 rounded-full p-0 text-lg"
                      onClick={() => setEditingSetNumber(set.setNumber)}
                    >
                      ✎
                    </ActionButton>
                  )}
                </div>
              ) : (
                <ActionButton
                  tone="primary"
                  className="min-h-11 w-auto rounded-xl px-3 text-xs sm:min-h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                  disabled={!isNext || !isValid(set) || restSeconds > 0}
                  onClick={() => onCompleteSet(set.setNumber)}
                >
                  Complete Set
                </ActionButton>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:mt-3 sm:grid-cols-2 sm:gap-3">
              {children(set, inputsDisabled)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeightRepsLogger(props: ExerciseLoggerProps) {
  const activeSet =
    props.exercise.sets.find((set) => !set.completedAt) ??
    props.exercise.sets.at(-1);
  const workingWeight = activeSet?.actualWeight;

  return (
    <>
      <label className="field mt-4 block max-w-xs text-xs sm:mt-6 sm:text-sm">
        <span>Working weight ({props.exercise.weightUnit})</span>
        <AppInput
          className="mt-1.5 min-h-11 rounded-xl px-3 py-2 text-base sm:mt-2 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3"
          inputMode="decimal"
          min="0"
          step="0.5"
          type="number"
          value={workingWeight ?? ""}
          onChange={(event) =>
            props.onWorkingWeightChange(
              event.target.value ? Number(event.target.value) : undefined,
            )
          }
        />
      </label>
      <SetContainer {...props} isValid={(set) => set.actualReps !== undefined}>
        {(set, inputsDisabled) => (
          <NumberInput
            label="Completed reps"
            value={set.actualReps}
            disabled={inputsDisabled}
            onChange={(actualReps) =>
              props.onUpdateSet(set.setNumber, { actualReps })
            }
          />
        )}
      </SetContainer>
    </>
  );
}

function RepsLogger(props: ExerciseLoggerProps) {
  return (
    <SetContainer {...props} isValid={(set) => set.actualReps !== undefined}>
      {(set, inputsDisabled) => (
        <NumberInput
          label="Completed reps"
          value={set.actualReps}
          disabled={inputsDisabled}
          onChange={(actualReps) =>
            props.onUpdateSet(set.setNumber, { actualReps })
          }
        />
      )}
    </SetContainer>
  );
}

function DurationLogger(props: ExerciseLoggerProps) {
  return (
    <SetContainer
      {...props}
      isValid={(set) => set.actualDurationSeconds !== undefined}
    >
      {(set, inputsDisabled) => (
        <NumberInput
          label="Duration (seconds)"
          value={set.actualDurationSeconds}
          disabled={inputsDisabled}
          onChange={(actualDurationSeconds) =>
            props.onUpdateSet(set.setNumber, { actualDurationSeconds })
          }
        />
      )}
    </SetContainer>
  );
}

const loggerByTrackingType: Record<
  TrackingType,
  React.ComponentType<ExerciseLoggerProps>
> = {
  weight_reps: WeightRepsLogger,
  reps: RepsLogger,
  duration: DurationLogger,
};

export function ExerciseLogger(props: ExerciseLoggerProps) {
  const Logger = loggerByTrackingType[props.exercise.trackingType];

  return <Logger {...props} />;
}

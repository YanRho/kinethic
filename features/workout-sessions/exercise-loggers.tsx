"use client";

import { useState } from "react";
import {
  SessionExercise,
  SessionSet,
  TrackingType,
} from "@/lib/kinethic/domain";

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
  onChange,
}: {
  label: string;
  value?: number;
  disabled?: boolean;
  step?: number;
  onChange(value?: number): void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        disabled={disabled}
        inputMode="decimal"
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
    <div className="mt-6 space-y-3">
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
            className={`rounded-2xl border p-3 ${isNext ? "theme-accent-surface" : "border-white/10 bg-black/15"}`}
            key={set.setNumber}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">Set {set.setNumber}</p>
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
                    <button
                      type="button"
                      aria-label="Save set correction"
                      title="Save correction"
                      className="flex h-10 min-h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg font-bold text-white/80 transition hover:border-emerald-300/50 hover:bg-emerald-300 hover:text-emerald-950 focus-visible:border-emerald-300/50 focus-visible:bg-emerald-300 focus-visible:text-emerald-950 focus-visible:outline-none"
                      onClick={() => setEditingSetNumber(null)}
                    >
                      ✓
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Edit completed set"
                      title="Edit completed set"
                      className="muted-button h-10 min-h-10 w-10 rounded-full p-0 text-lg"
                      onClick={() => setEditingSetNumber(set.setNumber)}
                    >
                      ✎
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className="primary-button w-auto"
                  disabled={!isNext || !isValid(set) || restSeconds > 0}
                  onClick={() => onCompleteSet(set.setNumber)}
                >
                  Complete Set
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
      <label className="field mt-6 block max-w-xs">
        <span>Working weight ({props.exercise.weightUnit})</span>
        <input
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

function CardioLogger(props: ExerciseLoggerProps) {
  return (
    <SetContainer
      {...props}
      isValid={(set) => set.actualDurationSeconds !== undefined}
    >
      {(set, inputsDisabled) => (
        <>
          <NumberInput
            label="Duration (seconds)"
            value={set.actualDurationSeconds}
            disabled={inputsDisabled}
            onChange={(actualDurationSeconds) =>
              props.onUpdateSet(set.setNumber, { actualDurationSeconds })
            }
          />
          <NumberInput
            label="Distance (optional)"
            value={set.actualDistance}
            disabled={inputsDisabled}
            step={0.01}
            onChange={(actualDistance) =>
              props.onUpdateSet(set.setNumber, { actualDistance })
            }
          />
          <NumberInput
            label="Speed (optional)"
            value={set.actualSpeed}
            disabled={inputsDisabled}
            step={0.1}
            onChange={(actualSpeed) =>
              props.onUpdateSet(set.setNumber, { actualSpeed })
            }
          />
          <NumberInput
            label="Incline % (optional)"
            value={set.actualIncline}
            disabled={inputsDisabled}
            step={0.5}
            onChange={(actualIncline) =>
              props.onUpdateSet(set.setNumber, { actualIncline })
            }
          />
          <NumberInput
            label="Resistance (optional)"
            value={set.actualResistance}
            disabled={inputsDisabled}
            step={0.5}
            onChange={(actualResistance) =>
              props.onUpdateSet(set.setNumber, { actualResistance })
            }
          />
        </>
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
  cardio: CardioLogger,
};

export function ExerciseLogger(props: ExerciseLoggerProps) {
  const Logger = loggerByTrackingType[props.exercise.trackingType];

  return <Logger {...props} />;
}

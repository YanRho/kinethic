"use client";

import {
  CSSProperties,
  ReactNode,
  useState,
  useSyncExternalStore,
} from "react";
import {
  WheelPicker,
  WheelPickerOption,
  WheelPickerValue,
  WheelPickerWrapper,
} from "@ncdai/react-wheel-picker";
import { ActionButton } from "@/components/kinethic-ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mobileQuery = "(max-width: 639px)";
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getSnapshot = () => window.matchMedia(mobileQuery).matches;
const getServerSnapshot = () => false;

const wheelClassNames = {
  optionItem: "text-slate-500",
  highlightWrapper:
    "rounded-xl border-y border-(--profile-accent-border) bg-(--profile-panel-strong) text-lg text-white",
  highlightItem: "font-semibold text-white",
};

const triggerClassName =
  "mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-(--profile-border) bg-(--profile-background) px-4 py-3 text-left text-base text-white outline-none transition active:scale-[0.99]";

const sheetClassName =
  "profile-theme profile-overlay z-[70] gap-0 rounded-t-3xl border-(--profile-border) text-white";

function PickerHeader({
  title,
  onCancel,
  onDone,
}: {
  title: string;
  onCancel(): void;
  onDone(): void;
}) {
  return (
    <SheetHeader className="flex-row items-center justify-between border-b border-white/10">
      <ActionButton type="button" onClick={onCancel}>
        Cancel
      </ActionButton>
      <SheetTitle className="text-center text-white">{title}</SheetTitle>
      <ActionButton
        type="button"
        tone="primary"
        className="min-h-10 w-auto rounded-xl px-4 py-2 text-sm"
        onClick={onDone}
      >
        Done
      </ActionButton>
    </SheetHeader>
  );
}

export function ResponsiveWheelField<T extends WheelPickerValue>({
  title,
  value,
  options,
  onValueChange,
  children,
  style,
}: {
  title: string;
  value: T;
  options: WheelPickerOption<T>[];
  onValueChange(value: T): void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const selected = options.find((option) => option.value === value);

  if (!mobile) return children;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraftValue(value);
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
        >
          <span>{selected?.label ?? value}</span>
          <span className="theme-accent-text text-xs font-semibold">
            Change
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={sheetClassName}
        style={style}
      >
        <PickerHeader
          title={title}
          onCancel={() => setOpen(false)}
          onDone={() => {
            onValueChange(draftValue);
            setOpen(false);
          }}
        />
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <WheelPickerWrapper className="h-56">
            <WheelPicker
              value={draftValue}
              onValueChange={setDraftValue}
              options={options}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
          </WheelPickerWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ResponsiveDoubleWheelField<
  TLeft extends WheelPickerValue,
  TRight extends WheelPickerValue,
>({
  title,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftOptions,
  rightOptions,
  displayValue,
  onValueChange,
  children,
  style,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: TLeft;
  rightValue: TRight;
  leftOptions: WheelPickerOption<TLeft>[];
  rightOptions: WheelPickerOption<TRight>[];
  displayValue: ReactNode;
  onValueChange(left: TLeft, right: TRight): void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const initialLeft = leftOptions.some((option) => option.value === leftValue)
    ? leftValue
    : (leftOptions[0]?.value ?? leftValue);
  const initialRight = rightOptions.some(
    (option) => option.value === rightValue,
  )
    ? rightValue
    : (rightOptions[0]?.value ?? rightValue);
  const [draftLeft, setDraftLeft] = useState(initialLeft);
  const [draftRight, setDraftRight] = useState(initialRight);

  if (!mobile) return children;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setDraftLeft(initialLeft);
          setDraftRight(initialRight);
        }
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
        >
          <span>{displayValue}</span>
          <span className="theme-accent-text text-xs font-semibold">
            Change
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={sheetClassName}
        style={style}
      >
        <PickerHeader
          title={title}
          onCancel={() => setOpen(false)}
          onDone={() => {
            onValueChange(draftLeft, draftRight);
            setOpen(false);
          }}
        />
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="grid grid-cols-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
          <WheelPickerWrapper className="mt-1 h-56">
            <WheelPicker
              value={draftLeft}
              onValueChange={setDraftLeft}
              options={leftOptions}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
            <WheelPicker
              value={draftRight}
              onValueChange={setDraftRight}
              options={rightOptions}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
          </WheelPickerWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ResponsiveTripleWheelField<
  TFirst extends WheelPickerValue,
  TSecond extends WheelPickerValue,
  TThird extends WheelPickerValue,
>({
  title,
  labels,
  values,
  options,
  displayValue,
  onValueChange,
  children,
  style,
}: {
  title: string;
  labels: [string, string, string];
  values: [TFirst, TSecond, TThird];
  options: [
    WheelPickerOption<TFirst>[],
    WheelPickerOption<TSecond>[],
    WheelPickerOption<TThird>[],
  ];
  displayValue: ReactNode;
  onValueChange(first: TFirst, second: TSecond, third: TThird): void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const selectedOrFirst = <T extends WheelPickerValue>(
    value: T,
    pickerOptions: WheelPickerOption<T>[],
  ) =>
    pickerOptions.some((option) => option.value === value)
      ? value
      : (pickerOptions[0]?.value ?? value);
  const [first, setFirst] = useState(() =>
    selectedOrFirst(values[0], options[0]),
  );
  const [second, setSecond] = useState(() =>
    selectedOrFirst(values[1], options[1]),
  );
  const [third, setThird] = useState(() =>
    selectedOrFirst(values[2], options[2]),
  );

  if (!mobile) return children;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFirst(selectedOrFirst(values[0], options[0]));
          setSecond(selectedOrFirst(values[1], options[1]));
          setThird(selectedOrFirst(values[2], options[2]));
        }
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
        >
          <span>{displayValue}</span>
          <span className="theme-accent-text text-xs font-semibold">
            Change
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={sheetClassName}
        style={style}
      >
        <PickerHeader
          title={title}
          onCancel={() => setOpen(false)}
          onDone={() => {
            onValueChange(first, second, third);
            setOpen(false);
          }}
        />
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="grid grid-cols-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            {labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <WheelPickerWrapper className="mt-1 h-56">
            <WheelPicker
              value={first}
              onValueChange={setFirst}
              options={options[0]}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
            <WheelPicker
              value={second}
              onValueChange={setSecond}
              options={options[1]}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
            <WheelPicker
              value={third}
              onValueChange={setThird}
              options={options[2]}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
          </WheelPickerWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type { WheelPickerOption };

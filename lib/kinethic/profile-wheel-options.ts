import type { WheelPickerOption } from "@/components/responsive-wheel-picker";
import { Sex } from "./domain";

const stringNumberOptions = (start: number, end: number, step = 1) =>
  Array.from(
    { length: Math.floor((end - start) / step) + 1 },
    (_, index) => {
      const value = String(start + index * step);
      return { value, label: value } satisfies WheelPickerOption<string>;
    },
  );

export const monthWheelOptions: WheelPickerOption<string>[] = [
  ...[
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].map((label, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label,
  })),
];
export const dayWheelOptions: WheelPickerOption<string>[] = [
  ...stringNumberOptions(1, 31).map((option) => ({
    ...option,
    value: option.value.padStart(2, "0"),
    label: option.value.padStart(2, "0"),
  })),
];
const currentYear = new Date().getFullYear();
export const birthYearWheelOptions: WheelPickerOption<string>[] = [
  ...Array.from({ length: 108 }, (_, index) => {
    const value = String(currentYear - 13 - index);
    return { value, label: value };
  }),
];

export const birthDateParts = (birthDate: string) => {
  const [year = "", month = "", day = ""] = birthDate.split("-");
  return { year, month, day };
};

export const formatBirthDate = (birthDate: string) => {
  const { year, month, day } = birthDateParts(birthDate);
  if (!year || !month || !day) return "Choose birthdate";
  return `${month}/${day}/${year}`;
};

export const birthDateFromParts = (month: string, day: string, year: string) => {
  if (!month || !day || !year) return "";
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const validDay = Math.min(Number(day), lastDay);
  return `${year}-${month}-${String(validDay).padStart(2, "0")}`;
};

export const weightWheelOptions = stringNumberOptions(33, 1400, 0.5);
export const initialWeightWheelOptions: WheelPickerOption<string>[] = [
  { value: "", label: "Choose weight" },
  ...weightWheelOptions,
];

export const feetWheelOptions = stringNumberOptions(1, 8);

export const inchesWheelOptions = stringNumberOptions(0, 11);

export const sexWheelOptions: WheelPickerOption<Sex>[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];
export const initialSexWheelOptions: WheelPickerOption<Sex | "">[] = [
  { value: "", label: "Choose sex" },
  ...sexWheelOptions,
];

export const includeCurrentWheelValue = (
  options: WheelPickerOption<string>[],
  value: string,
) =>
  value && !options.some((option) => option.value === value)
    ? [{ value, label: value }, ...options]
    : options;

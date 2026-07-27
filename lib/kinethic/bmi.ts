export type BmiCategory =
  | "Underweight"
  | "Normal weight"
  | "Pre-obesity"
  | "Obesity class I"
  | "Obesity class II"
  | "Obesity class III";

export function calculateBmi(weightLb: number, heightIn: number) {
  if (weightLb <= 0 || heightIn <= 0) return null;
  return (weightLb / heightIn ** 2) * 703;
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Pre-obesity";
  if (bmi < 35) return "Obesity class I";
  if (bmi < 40) return "Obesity class II";
  return "Obesity class III";
}

export function getHealthyWeightRange(heightIn: number) {
  const factor = heightIn ** 2 / 703;
  return {
    minLb: 18.5 * factor,
    maxLb: 24.9 * factor,
  };
}

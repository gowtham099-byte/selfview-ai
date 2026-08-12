export type SectorOption = { value: string; label: string };

export const SECTORS: SectorOption[] = [
  { value: "general", label: "General / any role" },
  { value: "it", label: "IT & Technology" },
  { value: "software", label: "Software Engineering" },
  { value: "government", label: "Government jobs" },
  { value: "civil-services", label: "Civil services" },
  { value: "banking", label: "Banking & finance" },
  { value: "teaching", label: "Teaching & education" },
  { value: "sales", label: "Sales & marketing" },
  { value: "healthcare", label: "Healthcare" },
];

export const INTERVIEW_TYPES: SectorOption[] = [
  { value: "mixed", label: "Mixed round" },
  { value: "hr", label: "HR / personality" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioural" },
  { value: "system-design", label: "System design" },
  { value: "interview", label: "Board / panel interview" },
];

export const DIFFICULTIES: SectorOption[] = [
  { value: "easy", label: "Warm-up" },
  { value: "medium", label: "Realistic" },
  { value: "hard", label: "Tough panel" },
];

export const EXPERIENCE_LEVELS: SectorOption[] = [
  { value: "fresher", label: "Fresher / student" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-7", label: "3-7 years" },
  { value: "7+", label: "7+ years" },
];

export function labelFor(list: SectorOption[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? value ?? "";
}

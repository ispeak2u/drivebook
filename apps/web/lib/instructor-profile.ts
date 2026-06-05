export type VerificationStatus = "unverified" | "submitted" | "verified";

export type AdminApprovalStatus = "pending" | "approved" | "rejected";

export type RoadTestSpecialization = "G2" | "G" | "nervous drivers" | "newcomers";

export interface InstructorProfile {
  id: string;
  fullName: string;
  photoUrl: string;
  bio: string;
  languagesSpoken: string[];
  areasServed: string[];
  verificationStatus: VerificationStatus;
  hourlyLessonRate: number;
  vehicleType: string;
  yearsOfExperience: number;
  roadTestSpecializations: RoadTestSpecialization[];
  adminApprovalStatus: AdminApprovalStatus;
}

export type InstructorProfileDraft = Omit<InstructorProfile, "id">;

export type InstructorProfileErrors = Partial<Record<keyof InstructorProfileDraft, string>>;

export const roadTestSpecializationOptions: RoadTestSpecialization[] = [
  "G2",
  "G",
  "nervous drivers",
  "newcomers"
];

export const torontoAreaOptions = [
  "Downtown Toronto",
  "North York",
  "Scarborough",
  "Etobicoke",
  "York",
  "East York",
  "Midtown",
  "The Beaches"
];

export const languageOptions = [
  "English",
  "French",
  "Mandarin",
  "Cantonese",
  "Hindi",
  "Punjabi",
  "Spanish",
  "Arabic",
  "Tagalog"
];

export function validateInstructorProfile(
  profile: InstructorProfileDraft
): InstructorProfileErrors {
  const errors: InstructorProfileErrors = {};

  if (profile.fullName.trim().length < 2) {
    errors.fullName = "Enter the instructor's full name.";
  }

  if (profile.photoUrl.trim() && !isValidUrl(profile.photoUrl)) {
    errors.photoUrl = "Enter a valid photo URL or leave this blank.";
  }

  if (profile.bio.trim().length < 30) {
    errors.bio = "Bio must be at least 30 characters.";
  }

  if (profile.languagesSpoken.length === 0) {
    errors.languagesSpoken = "Choose at least one language.";
  }

  if (profile.areasServed.length === 0) {
    errors.areasServed = "Choose at least one Toronto area.";
  }

  if (profile.hourlyLessonRate <= 0) {
    errors.hourlyLessonRate = "Hourly rate must be greater than zero.";
  }

  if (profile.vehicleType.trim().length < 2) {
    errors.vehicleType = "Enter the vehicle type.";
  }

  if (profile.yearsOfExperience < 0) {
    errors.yearsOfExperience = "Years of experience cannot be negative.";
  }

  if (profile.roadTestSpecializations.length === 0) {
    errors.roadTestSpecializations = "Choose at least one specialization.";
  }

  return errors;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

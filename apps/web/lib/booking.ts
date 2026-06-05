export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export interface BookingInstructor {
  id: string;
  name: string;
  area: string;
  vehicle: string;
  transmission: string;
  hourlyRate: number;
  rating: number;
}

export interface Booking {
  id: string;
  studentName: string;
  instructor: BookingInstructor;
  lessonDate: string;
  lessonTime: string;
  pickupLocation: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingDraft {
  instructorId: string;
  lessonDate: string;
  lessonTime: string;
  pickupLocation: string;
  notes: string;
}

export type BookingErrors = Partial<Record<keyof BookingDraft, string>>;

export const cancellationPolicyText =
  "Students can request cancellation up to 24 hours before a lesson. Late cancellations may be reviewed by DriveBook support. Instructors should accept or decline pending requests promptly so students can rebook if needed.";

export function validateBookingDraft(draft: BookingDraft): BookingErrors {
  const errors: BookingErrors = {};

  if (!draft.instructorId) {
    errors.instructorId = "Select an instructor.";
  }

  if (!draft.lessonDate) {
    errors.lessonDate = "Select a lesson date.";
  }

  if (!draft.lessonTime) {
    errors.lessonTime = "Select a lesson time.";
  }

  if (draft.pickupLocation.trim().length < 5) {
    errors.pickupLocation = "Enter a specific pickup location.";
  }

  return errors;
}

export function formatBookingStatus(status: BookingStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

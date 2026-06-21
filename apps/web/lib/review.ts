import type { Booking } from "./booking";

export type ReviewModerationStatus = "visible" | "flagged" | "hidden";

export interface ReviewRatings {
  overall: number;
  punctuality: number;
  communication: number;
  teachingClarity: number;
  vehicleCleanlinessSafety: number;
}

export interface InstructorReview {
  id: string;
  bookingId: string;
  instructorId: string;
  instructorName: string;
  studentName: string;
  ratings: ReviewRatings;
  wouldRecommend: boolean;
  writtenReview: string;
  isVerifiedLesson: true;
  moderationStatus: ReviewModerationStatus;
  createdAt: string;
}

export interface ReviewDraft {
  bookingId: string;
  ratings: ReviewRatings;
  wouldRecommend: boolean;
  writtenReview: string;
}

export type ReviewErrors = Partial<Record<keyof ReviewDraft | keyof ReviewRatings, string>>;

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  wouldRecommendPercent: number;
}

export function getCompletedReviewableBookings(bookings: Booking[]) {
  return bookings.filter((booking) => booking.status === "completed");
}

export function validateReviewDraft(
  draft: ReviewDraft,
  completedBookings: Booking[] = []
): ReviewErrors {
  const errors: ReviewErrors = {};

  if (!draft.bookingId) {
    errors.bookingId = "Choose a completed lesson.";
  } else if (
    completedBookings.length > 0 &&
    !completedBookings.some((booking) => booking.id === draft.bookingId)
  ) {
    errors.bookingId = "Only completed lessons can receive reviews.";
  }

  for (const [key, value] of Object.entries(draft.ratings) as Array<
    [keyof ReviewRatings, number]
  >) {
    if (value < 1 || value > 5) {
      errors[key] = "Rating must be between 1 and 5.";
    }
  }

  if (draft.writtenReview.trim().length < 20) {
    errors.writtenReview = "Write at least 20 characters about the lesson.";
  }

  return errors;
}

export function calculateRatingSummary(reviews: InstructorReview[]): RatingSummary {
  const visibleReviews = reviews.filter((review) => review.moderationStatus !== "hidden");

  if (visibleReviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, wouldRecommendPercent: 0 };
  }

  const averageRating =
    visibleReviews.reduce((total, review) => total + review.ratings.overall, 0) /
    visibleReviews.length;
  const recommendCount = visibleReviews.filter((review) => review.wouldRecommend).length;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews: visibleReviews.length,
    wouldRecommendPercent: Math.round((recommendCount / visibleReviews.length) * 100)
  };
}

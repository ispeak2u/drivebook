import type { InstructorReview } from "../lib/review";
import { calculateRatingSummary } from "../lib/review";

export function RatingSummary({
  compact = false,
  reviews
}: {
  compact?: boolean;
  reviews: InstructorReview[];
}) {
  const summary = calculateRatingSummary(reviews);

  return (
    <section className={compact ? "rating-summary compact" : "grid three"}>
      <div className={compact ? "summary-item" : "panel metric"}>
        <strong>{summary.averageRating || "New"}</strong>
        <p>Average rating</p>
      </div>
      <div className={compact ? "summary-item" : "panel metric"}>
        <strong>{summary.totalReviews}</strong>
        <p>Total reviews</p>
      </div>
      <div className={compact ? "summary-item" : "panel metric"}>
        <strong>{summary.wouldRecommendPercent}%</strong>
        <p>Would recommend</p>
      </div>
    </section>
  );
}

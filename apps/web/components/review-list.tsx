import type { InstructorReview } from "../lib/review";

export function ReviewList({
  reviews,
  showModeration = false
}: {
  reviews: InstructorReview[];
  showModeration?: boolean;
}) {
  const visibleReviews = showModeration
    ? reviews
    : reviews.filter((review) => review.moderationStatus !== "hidden");

  return (
    <div className="list">
      {visibleReviews.map((review) => (
        <article className="review-row" key={review.id}>
          <div className="card-top">
            <div>
              <h3>{review.instructorName}</h3>
              <p>
                Reviewed by {review.studentName} - {review.createdAt.slice(0, 10)}
              </p>
            </div>
            <div className="review-badges">
              <span className="badge">{review.ratings.overall}/5</span>
              <span className="badge success">Verified lesson</span>
              {showModeration ? (
                <span className={review.moderationStatus === "hidden" ? "badge danger" : "badge warning"}>
                  {review.moderationStatus}
                </span>
              ) : null}
            </div>
          </div>

          <p>{review.writtenReview}</p>

          <div className="rating-breakdown">
            <RatingPill label="Punctuality" value={review.ratings.punctuality} />
            <RatingPill label="Communication" value={review.ratings.communication} />
            <RatingPill label="Teaching clarity" value={review.ratings.teachingClarity} />
            <RatingPill
              label="Vehicle safety"
              value={review.ratings.vehicleCleanlinessSafety}
            />
            <span className={review.wouldRecommend ? "tag" : "tag muted"}>
              {review.wouldRecommend ? "Would recommend" : "Would not recommend"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function RatingPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="tag">
      {label}: {value}/5
    </span>
  );
}

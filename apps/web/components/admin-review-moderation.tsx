"use client";

import { useState } from "react";
import type { InstructorReview, ReviewModerationStatus } from "../lib/review";
import { ReviewList } from "./review-list";

export function AdminReviewModeration({ reviews }: { reviews: InstructorReview[] }) {
  const [statuses, setStatuses] = useState<Record<string, ReviewModerationStatus>>(
    Object.fromEntries(reviews.map((review) => [review.id, review.moderationStatus]))
  );

  const moderatedReviews = reviews.map((review) => ({
    ...review,
    moderationStatus: statuses[review.id] ?? review.moderationStatus
  }));

  function updateStatus(reviewId: string, status: ReviewModerationStatus) {
    setStatuses((current) => ({ ...current, [reviewId]: status }));
  }

  return (
    <section className="panel grid">
      <div className="card-top">
        <div>
          <h2>Review moderation queue</h2>
          <p>Flag or hide reviews locally. No database changes are made.</p>
        </div>
      </div>

      <div className="list">
        {moderatedReviews.map((review) => (
          <div className="moderation-row" key={review.id}>
            <ReviewList reviews={[review]} showModeration />
            <div className="actions compact">
              <button className="button secondary" onClick={() => updateStatus(review.id, "visible")} type="button">
                Mark visible
              </button>
              <button className="button secondary" onClick={() => updateStatus(review.id, "flagged")} type="button">
                Flag
              </button>
              <button
                className="button secondary danger"
                onClick={() => updateStatus(review.id, "hidden")}
                type="button"
              >
                Hide
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

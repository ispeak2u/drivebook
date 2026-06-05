"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Booking } from "../lib/booking";
import type { ReviewDraft, ReviewRatings } from "../lib/review";
import { getCompletedReviewableBookings, validateReviewDraft } from "../lib/review";

const initialRatings: ReviewRatings = {
  overall: 5,
  punctuality: 5,
  communication: 5,
  teachingClarity: 5,
  vehicleCleanlinessSafety: 5
};

export function ReviewForm({ bookings }: { bookings: Booking[] }) {
  const reviewableBookings = useMemo(() => getCompletedReviewableBookings(bookings), [bookings]);
  const [draft, setDraft] = useState<ReviewDraft>({
    bookingId: reviewableBookings[0]?.id ?? "",
    ratings: initialRatings,
    wouldRecommend: true,
    writtenReview: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedBooking = reviewableBookings.find((booking) => booking.id === draft.bookingId);
  const errors = useMemo(
    () => validateReviewDraft(draft, reviewableBookings),
    [draft, reviewableBookings]
  );
  const hasErrors = Object.keys(errors).length > 0;

  function updateRating(field: keyof ReviewRatings, value: number) {
    setDraft((current) => ({
      ...current,
      ratings: { ...current.ratings, [field]: value }
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="panel">
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="completedBooking">Completed lesson</label>
          <select
            id="completedBooking"
            onChange={(event) =>
              setDraft((current) => ({ ...current, bookingId: event.target.value }))
            }
            value={draft.bookingId}
          >
            {reviewableBookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.instructor.name} - {booking.lessonDate} at {booking.lessonTime}
              </option>
            ))}
          </select>
          {submitted && errors.bookingId ? (
            <span className="error-text">{errors.bookingId}</span>
          ) : null}
        </div>

        {selectedBooking ? (
          <div className="policy-note">
            <span className="badge success">Verified completed lesson</span>
            <p>Reviews can only be submitted for completed DriveBook bookings.</p>
          </div>
        ) : null}

        <div className="rating-input-grid">
          <RatingInput
            error={submitted ? errors.overall : undefined}
            label="Overall rating"
            onChange={(value) => updateRating("overall", value)}
            value={draft.ratings.overall}
          />
          <RatingInput
            error={submitted ? errors.punctuality : undefined}
            label="Punctuality"
            onChange={(value) => updateRating("punctuality", value)}
            value={draft.ratings.punctuality}
          />
          <RatingInput
            error={submitted ? errors.communication : undefined}
            label="Communication"
            onChange={(value) => updateRating("communication", value)}
            value={draft.ratings.communication}
          />
          <RatingInput
            error={submitted ? errors.teachingClarity : undefined}
            label="Teaching clarity"
            onChange={(value) => updateRating("teachingClarity", value)}
            value={draft.ratings.teachingClarity}
          />
          <RatingInput
            error={submitted ? errors.vehicleCleanlinessSafety : undefined}
            label="Vehicle cleanliness/safety"
            onChange={(value) => updateRating("vehicleCleanlinessSafety", value)}
            value={draft.ratings.vehicleCleanlinessSafety}
          />
        </div>

        <fieldset className="checkbox-group">
          <legend>Recommendation</legend>
          <label className="checkbox-option">
            <input
              checked={draft.wouldRecommend}
              onChange={(event) =>
                setDraft((current) => ({ ...current, wouldRecommend: event.target.checked }))
              }
              type="checkbox"
            />
            <span>I would recommend this instructor</span>
          </label>
        </fieldset>

        <div className="field">
          <label htmlFor="writtenReview">Written review</label>
          <textarea
            id="writtenReview"
            onChange={(event) =>
              setDraft((current) => ({ ...current, writtenReview: event.target.value }))
            }
            placeholder="Share what future students should know."
            value={draft.writtenReview}
          />
          {submitted && errors.writtenReview ? (
            <span className="error-text">{errors.writtenReview}</span>
          ) : null}
        </div>

        <div className="actions">
          <button className="button" type="submit">
            Submit review
          </button>
          {submitted ? (
            <span className={hasErrors ? "form-status error" : "form-status success"}>
              {hasErrors ? "Fix the highlighted fields." : "Review validated as verified."}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function RatingInput({
  error,
  label,
  onChange,
  value
}: {
  error?: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-").replace("/", "-");

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} onChange={(event) => onChange(Number(event.target.value))} value={value}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}

import Link from "next/link";
import { RatingSummary } from "../../components/rating-summary";
import { ReviewForm } from "../../components/review-form";
import { ReviewList } from "../../components/review-list";
import { mockBookings, mockMayaReviews, mockReviews } from "../../lib/placeholder-data";

export default function ReviewsPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Verified reviews</span>
        <h1>Lesson feedback</h1>
        <p>
          Students can review completed bookings only. Reviews carry a verified
          lesson badge and can be moderated by admins.
        </p>
      </header>

      <div className="actions" style={{ marginBottom: 14 }}>
        <Link className="button secondary" href="/admin/reviews">
          Admin moderation
        </Link>
      </div>

      <RatingSummary reviews={mockMayaReviews} />

      <section className="grid two" style={{ marginTop: 14 }}>
        <div className="grid">
          <div className="panel grid">
            <h2>Write a verified review</h2>
            <p>Only completed mock bookings appear in the lesson selector.</p>
          </div>
          <ReviewForm bookings={mockBookings} />
        </div>

        <section className="panel grid">
          <div className="card-top">
            <div>
              <h2>Latest reviews</h2>
              <p>Hidden reviews are excluded from the public list.</p>
            </div>
          </div>
          <ReviewList reviews={mockReviews} />
        </section>
      </section>
    </>
  );
}

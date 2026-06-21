"use client";

import type { Booking } from "../lib/booking";
import { cancellationPolicyText } from "../lib/booking";
import { BookingStatusBadge } from "./booking-status-badge";

export function BookingConfirmation({
  booking,
  onCreateAnother
}: {
  booking: Booking;
  onCreateAnother: () => void;
}) {
  return (
    <section className="panel grid">
      <div className="card-top">
        <div>
          <h2>Lesson request sent</h2>
          <p>Your booking starts as pending until the instructor responds.</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="booking-summary">
        <SummaryItem label="Instructor" value={booking.instructor.name} />
        <SummaryItem label="Date" value={booking.lessonDate} />
        <SummaryItem label="Time" value={booking.lessonTime} />
        <SummaryItem label="Pickup" value={booking.pickupLocation} />
      </div>

      {booking.notes ? (
        <div className="policy-note">
          <h3>Lesson notes</h3>
          <p>{booking.notes}</p>
        </div>
      ) : null}

      <div className="policy-note">
        <h3>Cancellation policy</h3>
        <p>{cancellationPolicyText}</p>
      </div>

      <div className="actions">
        <button className="button" onClick={onCreateAnother} type="button">
          Create another booking
        </button>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

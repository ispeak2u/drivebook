"use client";

import { useState } from "react";
import type { Booking, BookingStatus } from "../lib/booking";
import { cancellationPolicyText } from "../lib/booking";
import { BookingStatusBadge } from "./booking-status-badge";

export function InstructorBookingDashboard({ bookings }: { bookings: Booking[] }) {
  const [bookingStatuses, setBookingStatuses] = useState<Record<string, BookingStatus>>(
    Object.fromEntries(bookings.map((booking) => [booking.id, booking.status]))
  );

  function updateBookingStatus(bookingId: string, status: BookingStatus) {
    setBookingStatuses((current) => ({ ...current, [bookingId]: status }));
  }

  const pendingCount = Object.values(bookingStatuses).filter((status) => status === "pending").length;

  return (
    <>
      <section className="grid three">
        <div className="panel metric">
          <strong>{bookings.length}</strong>
          <p>Booking requests</p>
        </div>
        <div className="panel metric">
          <strong>{pendingCount}</strong>
          <p>Awaiting action</p>
        </div>
        <div className="panel metric">
          <strong>
            {Object.values(bookingStatuses).filter((status) => status === "accepted").length}
          </strong>
          <p>Accepted lessons</p>
        </div>
      </section>

      <section className="panel grid" style={{ marginTop: 14 }}>
        <h2>Student booking requests</h2>
        <div className="list">
          {bookings.map((booking) => {
            const status = bookingStatuses[booking.id] ?? booking.status;
            return (
              <div className="booking-row" key={booking.id}>
                <div>
                  <h3>{booking.studentName}</h3>
                  <p>
                    {booking.lessonDate} at {booking.lessonTime} - Pickup:{" "}
                    {booking.pickupLocation}
                  </p>
                  {booking.notes ? <p>{booking.notes}</p> : null}
                </div>
                <div className="booking-actions">
                  <BookingStatusBadge status={status} />
                  {status === "pending" ? (
                    <div className="actions compact">
                      <button
                        className="button"
                        onClick={() => updateBookingStatus(booking.id, "accepted")}
                        type="button"
                      >
                        Accept
                      </button>
                      <button
                        className="button secondary danger"
                        onClick={() => updateBookingStatus(booking.id, "declined")}
                        type="button"
                      >
                        Decline
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel policy-note" style={{ marginTop: 14 }}>
        <h2>Cancellation policy</h2>
        <p>{cancellationPolicyText}</p>
      </section>
    </>
  );
}

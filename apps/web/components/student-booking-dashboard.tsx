import type { Booking } from "../lib/booking";
import { cancellationPolicyText } from "../lib/booking";
import { BookingStatusBadge } from "./booking-status-badge";

export function StudentBookingDashboard({ bookings }: { bookings: Booking[] }) {
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

  return (
    <>
      <section className="grid three">
        <div className="panel metric">
          <strong>{bookings.length}</strong>
          <p>Total lesson requests</p>
        </div>
        <div className="panel metric">
          <strong>{pendingCount}</strong>
          <p>Pending instructor response</p>
        </div>
        <div className="panel metric">
          <strong>{bookings.filter((booking) => booking.status === "accepted").length}</strong>
          <p>Accepted lessons</p>
        </div>
      </section>

      <section className="panel grid" style={{ marginTop: 14 }}>
        <div className="card-top">
          <h2>Your booking requests</h2>
        </div>
        <div className="list">
          {bookings.map((booking) => (
            <div className="booking-row" key={booking.id}>
              <div>
                <h3>{booking.instructor.name}</h3>
                <p>
                  {booking.lessonDate} at {booking.lessonTime} - Pickup:{" "}
                  {booking.pickupLocation}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel policy-note" style={{ marginTop: 14 }}>
        <h2>Cancellation policy</h2>
        <p>{cancellationPolicyText}</p>
      </section>
    </>
  );
}

import Link from "next/link";
import { instructors, mockBookings } from "../lib/placeholder-data";
import { BookingStatusBadge } from "../components/booking-status-badge";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">DriveBook MVP</span>
          <h1>Book trusted driving instructors with less back-and-forth.</h1>
          <p>
            A clean mobile-first shell for students, instructors, and operations teams.
            This version uses placeholder data only.
          </p>
          <div className="actions">
            <Link className="button" href="/signup/student">
              Student signup
            </Link>
            <Link className="button secondary" href="/signup/instructor">
              Instructor signup
            </Link>
          </div>
        </div>

        <div className="panel grid">
          <h2>Today at a glance</h2>
          <div className="grid two">
            <div className="metric">
              <strong>{instructors.length}</strong>
              <p>Available instructors</p>
            </div>
            <div className="metric">
              <strong>{mockBookings.length}</strong>
              <p>Booking requests</p>
            </div>
          </div>
          <div className="list">
            {mockBookings.slice(0, 2).map((booking) => (
              <div className="list-row" key={booking.id}>
                <div>
                  <h3>{booking.instructor.name}</h3>
                  <p>
                    {booking.lessonDate} at {booking.lessonTime}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid three">
        <div className="panel">
          <h2>For students</h2>
          <p>Find instructors by area, transmission type, rating, and upcoming availability.</p>
        </div>
        <div className="panel">
          <h2>For instructors</h2>
          <p>Prepare onboarding, profile details, availability, and upcoming lesson views.</p>
        </div>
        <div className="panel">
          <h2>For admins</h2>
          <p>Keep instructor approval and marketplace monitoring ready for the next phase.</p>
        </div>
      </section>
    </>
  );
}

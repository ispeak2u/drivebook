import Link from "next/link";
import { StudentBookingDashboard } from "../../../components/student-booking-dashboard";
import { mockBookings } from "../../../lib/placeholder-data";

export default function StudentDashboardPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Student dashboard</span>
        <h1>Your lessons</h1>
        <p>Track pending, accepted, and declined instructor booking responses.</p>
      </header>

      <div className="actions" style={{ marginBottom: 14 }}>
        <Link className="button" href="/booking">
          Create booking
        </Link>
        <Link className="button secondary" href="/search">
          Search instructors
        </Link>
      </div>

      <StudentBookingDashboard bookings={mockBookings} />
    </>
  );
}

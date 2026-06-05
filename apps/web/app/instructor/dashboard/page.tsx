import Link from "next/link";
import { InstructorBookingDashboard } from "../../../components/instructor-booking-dashboard";
import { InstructorProfileCard } from "../../../components/instructor-profile-card";
import {
  mockInstructorBookingRequests,
  mockInstructorProfile,
  mockMayaReviews
} from "../../../lib/placeholder-data";

export default function InstructorDashboardPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Instructor dashboard</span>
        <h1>Booking requests</h1>
        <p>Accept or decline student lesson requests using mock booking data.</p>
      </header>

      <div className="actions" style={{ marginBottom: 14 }}>
        <Link className="button secondary" href="/instructor/profile">
          Edit profile
        </Link>
      </div>

      <InstructorBookingDashboard bookings={mockInstructorBookingRequests} />

      <section style={{ marginTop: 14 }}>
        <InstructorProfileCard profile={mockInstructorProfile} reviews={mockMayaReviews} />
      </section>
    </>
  );
}

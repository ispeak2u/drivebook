import { InstructorProfileCard } from "../../../components/instructor-profile-card";
import { InstructorProfileForm } from "../../../components/instructor-profile-form";
import { mockInstructorProfile, mockMayaReviews } from "../../../lib/placeholder-data";

export default function InstructorProfilePage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Instructor profile</span>
        <h1>Create your marketplace profile</h1>
        <p>
          Add the details students and admins need before the instructor can be approved.
          This page uses local state and mock data only.
        </p>
      </header>

      <section className="grid" style={{ marginBottom: 14 }}>
        <div className="card-top">
          <div>
            <h2>Current mock profile</h2>
            <p>Example of how an approved marketplace card will read after review.</p>
          </div>
        </div>
        <InstructorProfileCard profile={mockInstructorProfile} reviews={mockMayaReviews} />
      </section>

      <InstructorProfileForm />
    </>
  );
}

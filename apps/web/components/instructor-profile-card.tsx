import type { InstructorProfile } from "../lib/instructor-profile";
import type { InstructorReview } from "../lib/review";
import { RatingSummary } from "./rating-summary";
import { ReviewList } from "./review-list";

interface InstructorProfileCardProps {
  profile: InstructorProfile;
  reviews?: InstructorReview[];
}

const approvalTone = {
  pending: "badge warning",
  approved: "badge success",
  rejected: "badge danger"
};

export function InstructorProfileCard({ profile, reviews = [] }: InstructorProfileCardProps) {
  const displayName = profile.fullName.trim() || "Draft instructor";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="panel instructor-profile-card">
      <div className="profile-heading">
        <div className="profile-photo" aria-label={`${displayName} profile photo`}>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="profile-title">
          <div className="card-top">
            <div>
              <h2>{displayName}</h2>
              <p>{profile.vehicleType}</p>
            </div>
            <span className={approvalTone[profile.adminApprovalStatus]}>
              {profile.adminApprovalStatus}
            </span>
          </div>
          <div className="inline-meta">
            <span>${profile.hourlyLessonRate}/hr</span>
            <span>{profile.yearsOfExperience} years</span>
            <span>{profile.verificationStatus}</span>
          </div>
        </div>
      </div>

      <p>{profile.bio}</p>

      <div className="profile-detail-grid">
        <ProfileDetail label="Languages" values={profile.languagesSpoken} />
        <ProfileDetail label="Areas served" values={profile.areasServed} />
        <ProfileDetail label="Specializes in" values={profile.roadTestSpecializations} />
      </div>

      {reviews.length > 0 ? (
        <div className="profile-reviews">
          <RatingSummary compact reviews={reviews} />
          <div className="panel-flat grid">
            <div className="card-top">
              <h3>Latest verified reviews</h3>
              <span className="badge success">Verified lesson</span>
            </div>
            <ReviewList reviews={reviews.slice(0, 2)} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ProfileDetail({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="profile-detail">
      <h3>{label}</h3>
      <div className="tag-list">
        {values.map((value) => (
          <span className="tag" key={value}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

import { AdminReviewModeration } from "../../../components/admin-review-moderation";
import { mockReviews } from "../../../lib/placeholder-data";

export default function AdminReviewModerationPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Review moderation</h1>
        <p>Mock moderation controls for flagging or hiding instructor reviews.</p>
      </header>

      <AdminReviewModeration reviews={mockReviews} />
    </>
  );
}

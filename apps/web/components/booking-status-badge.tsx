import type { BookingStatus } from "../lib/booking";
import { formatBookingStatus } from "../lib/booking";

const statusClass: Record<BookingStatus, string> = {
  pending: "badge warning",
  accepted: "badge success",
  declined: "badge danger",
  cancelled: "badge",
  completed: "badge success"
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <span className={statusClass[status]}>{formatBookingStatus(status)}</span>;
}

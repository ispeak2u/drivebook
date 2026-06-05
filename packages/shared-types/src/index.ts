export type UserRole = "student" | "instructor" | "admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "disputed";

export interface ApiResponse<T> {
  data: T;
  requestId?: string;
}

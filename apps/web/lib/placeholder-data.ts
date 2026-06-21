import type { InstructorProfile } from "./instructor-profile";
import type { Booking, BookingInstructor } from "./booking";
import type { InstructorReview } from "./review";

export const mockInstructorProfile: InstructorProfile = {
  id: "profile-001",
  fullName: "Maya Chen",
  photoUrl: "",
  bio: "Patient Toronto driving instructor focused on calm road test preparation, parking confidence, and clear feedback after every lesson.",
  languagesSpoken: ["English", "Mandarin"],
  areasServed: ["North York", "Midtown", "Downtown Toronto"],
  verificationStatus: "submitted",
  hourlyLessonRate: 58,
  vehicleType: "Toyota Corolla, automatic",
  yearsOfExperience: 8,
  roadTestSpecializations: ["G2", "nervous drivers", "newcomers"],
  adminApprovalStatus: "pending"
};

export const instructors = [
  {
    id: "ins-001",
    name: "Maya Chen",
    area: "North York",
    vehicle: "Toyota Corolla",
    transmission: "Automatic",
    rating: 4.9,
    lessons: 286,
    nextSlot: "Today, 4:30 PM",
    price: "$58/hr"
  },
  {
    id: "ins-002",
    name: "Daniel Brooks",
    area: "Mississauga",
    vehicle: "Honda Civic",
    transmission: "Manual",
    rating: 4.8,
    lessons: 194,
    nextSlot: "Tomorrow, 10:00 AM",
    price: "$62/hr"
  },
  {
    id: "ins-003",
    name: "Amara Singh",
    area: "Scarborough",
    vehicle: "Hyundai Elantra",
    transmission: "Automatic",
    rating: 4.7,
    lessons: 331,
    nextSlot: "Friday, 2:00 PM",
    price: "$55/hr"
  }
];

export const bookingInstructors: BookingInstructor[] = instructors.map((instructor) => ({
  id: instructor.id,
  name: instructor.name,
  area: instructor.area,
  vehicle: instructor.vehicle,
  transmission: instructor.transmission,
  hourlyRate: Number(instructor.price.replace(/[^0-9]/g, "")),
  rating: instructor.rating
}));

export const lessonTimeOptions = [
  "9:00 AM",
  "10:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:30 PM",
  "6:00 PM"
];

export const mockBookings: Booking[] = [
  {
    id: "booking-001",
    studentName: "Alex Morgan",
    instructor: bookingInstructors[0],
    lessonDate: "2026-06-08",
    lessonTime: "4:30 PM",
    pickupLocation: "Yonge and Sheppard",
    notes: "G2 test prep and parallel parking practice.",
    status: "pending",
    createdAt: "2026-06-05T13:00:00.000Z"
  },
  {
    id: "booking-002",
    studentName: "Alex Morgan",
    instructor: bookingInstructors[1],
    lessonDate: "2026-06-09",
    lessonTime: "10:30 AM",
    pickupLocation: "Square One transit terminal",
    notes: "Manual lesson with lane changes.",
    status: "accepted",
    createdAt: "2026-06-04T10:15:00.000Z"
  },
  {
    id: "booking-003",
    studentName: "Alex Morgan",
    instructor: bookingInstructors[2],
    lessonDate: "2026-06-12",
    lessonTime: "1:00 PM",
    pickupLocation: "Kennedy Station",
    notes: "Newcomer orientation and road signs.",
    status: "declined",
    createdAt: "2026-06-03T17:30:00.000Z"
  },
  {
    id: "booking-004",
    studentName: "Elaine M.",
    instructor: bookingInstructors[0],
    lessonDate: "2026-05-28",
    lessonTime: "2:30 PM",
    pickupLocation: "Bay and College",
    notes: "Completed G2 prep lesson.",
    status: "completed",
    createdAt: "2026-05-25T09:30:00.000Z"
  },
  {
    id: "booking-005",
    studentName: "Jordan T.",
    instructor: bookingInstructors[0],
    lessonDate: "2026-05-22",
    lessonTime: "10:30 AM",
    pickupLocation: "Davisville Station",
    notes: "Completed nervous driver refresher.",
    status: "completed",
    createdAt: "2026-05-19T14:45:00.000Z"
  },
  {
    id: "booking-006",
    studentName: "Ravi K.",
    instructor: bookingInstructors[1],
    lessonDate: "2026-05-17",
    lessonTime: "9:00 AM",
    pickupLocation: "King and Spadina",
    notes: "Completed manual driving lesson.",
    status: "completed",
    createdAt: "2026-05-14T08:30:00.000Z"
  }
];

export const mockInstructorBookingRequests = mockBookings.filter(
  (booking) => booking.instructor.id === "ins-001"
);

export const mockReviews: InstructorReview[] = [
  {
    id: "review-001",
    bookingId: "booking-004",
    instructorId: "ins-001",
    instructorName: "Maya Chen",
    studentName: "Elaine M.",
    ratings: {
      overall: 5,
      punctuality: 5,
      communication: 5,
      teachingClarity: 5,
      vehicleCleanlinessSafety: 5
    },
    wouldRecommend: true,
    writtenReview: "Calm, structured, and clear before my G2 road test. The lesson felt focused and safe.",
    isVerifiedLesson: true,
    moderationStatus: "visible",
    createdAt: "2026-05-29T12:00:00.000Z"
  },
  {
    id: "review-002",
    bookingId: "booking-005",
    instructorId: "ins-001",
    instructorName: "Maya Chen",
    studentName: "Jordan T.",
    ratings: {
      overall: 4,
      punctuality: 4,
      communication: 5,
      teachingClarity: 4,
      vehicleCleanlinessSafety: 5
    },
    wouldRecommend: true,
    writtenReview: "Very patient with nervous driving. I liked the clear route feedback after the lesson.",
    isVerifiedLesson: true,
    moderationStatus: "flagged",
    createdAt: "2026-05-23T16:20:00.000Z"
  },
  {
    id: "review-003",
    bookingId: "booking-006",
    instructorId: "ins-002",
    instructorName: "Daniel Brooks",
    studentName: "Ravi K.",
    ratings: {
      overall: 5,
      punctuality: 5,
      communication: 4,
      teachingClarity: 5,
      vehicleCleanlinessSafety: 4
    },
    wouldRecommend: true,
    writtenReview: "Great for manual practice and downtown driving confidence.",
    isVerifiedLesson: true,
    moderationStatus: "visible",
    createdAt: "2026-05-18T11:10:00.000Z"
  }
];

export const mockMayaReviews = mockReviews.filter((review) => review.instructorId === "ins-001");

import { BookingForm } from "../../components/booking-form";
import { bookingInstructors, lessonTimeOptions } from "../../lib/placeholder-data";

export default function BookingPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Booking</span>
        <h1>Reserve a lesson</h1>
        <p>
          Select an instructor, choose a date and time, enter pickup details, and
          submit a pending lesson request.
        </p>
      </header>

      <BookingForm instructors={bookingInstructors} lessonTimes={lessonTimeOptions} />
    </>
  );
}

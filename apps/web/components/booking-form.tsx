"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Booking, BookingDraft } from "../lib/booking";
import { cancellationPolicyText, validateBookingDraft } from "../lib/booking";
import type { BookingInstructor } from "../lib/booking";
import { BookingConfirmation } from "./booking-confirmation";

const initialDraft: BookingDraft = {
  instructorId: "",
  lessonDate: "",
  lessonTime: "",
  pickupLocation: "",
  notes: ""
};

export function BookingForm({
  instructors,
  lessonTimes
}: {
  instructors: BookingInstructor[];
  lessonTimes: string[];
}) {
  const [draft, setDraft] = useState<BookingDraft>({
    ...initialDraft,
    instructorId: instructors[0]?.id ?? ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const selectedInstructor = instructors.find((instructor) => instructor.id === draft.instructorId);
  const errors = useMemo(() => validateBookingDraft(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;

  function updateField<K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors || !selectedInstructor) {
      return;
    }

    setConfirmedBooking({
      id: "booking-draft-001",
      studentName: "Alex Morgan",
      instructor: selectedInstructor,
      lessonDate: draft.lessonDate,
      lessonTime: draft.lessonTime,
      pickupLocation: draft.pickupLocation,
      notes: draft.notes,
      status: "pending",
      createdAt: new Date().toISOString()
    });
  }

  if (confirmedBooking) {
    return (
      <BookingConfirmation
        booking={confirmedBooking}
        onCreateAnother={() => {
          setConfirmedBooking(null);
          setSubmitted(false);
          setDraft({ ...initialDraft, instructorId: instructors[0]?.id ?? "" });
        }}
      />
    );
  }

  return (
    <section className="grid two">
      <div className="panel grid">
        <h2>Select instructor</h2>
        <div className="booking-instructor-list">
          {instructors.map((instructor) => (
            <label className="booking-option" key={instructor.id}>
              <input
                checked={draft.instructorId === instructor.id}
                name="instructor"
                onChange={() => updateField("instructorId", instructor.id)}
                type="radio"
              />
              <span className="avatar">{instructor.name.slice(0, 1)}</span>
              <span>
                <strong>{instructor.name}</strong>
                <small>
                  {instructor.area} - {instructor.vehicle} - ${instructor.hourlyRate}/hr
                </small>
              </span>
            </label>
          ))}
        </div>
        {submitted && errors.instructorId ? (
          <span className="error-text">{errors.instructorId}</span>
        ) : null}
      </div>

      <div className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="grid two">
            <div className="field">
              <label htmlFor="lessonDate">Lesson date</label>
              <input
                id="lessonDate"
                onChange={(event) => updateField("lessonDate", event.target.value)}
                type="date"
                value={draft.lessonDate}
              />
              {submitted && errors.lessonDate ? (
                <span className="error-text">{errors.lessonDate}</span>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="lessonTime">Lesson time</label>
              <select
                id="lessonTime"
                onChange={(event) => updateField("lessonTime", event.target.value)}
                value={draft.lessonTime}
              >
                <option value="">Select time</option>
                {lessonTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {submitted && errors.lessonTime ? (
                <span className="error-text">{errors.lessonTime}</span>
              ) : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="pickupLocation">Pickup location</label>
            <input
              id="pickupLocation"
              onChange={(event) => updateField("pickupLocation", event.target.value)}
              placeholder="Yonge and Sheppard"
              value={draft.pickupLocation}
            />
            {submitted && errors.pickupLocation ? (
              <span className="error-text">{errors.pickupLocation}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="notes">Lesson notes</label>
            <textarea
              id="notes"
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Road test date, route focus, or accessibility notes."
              value={draft.notes}
            />
          </div>

          <div className="policy-note">
            <h3>Cancellation policy</h3>
            <p>{cancellationPolicyText}</p>
          </div>

          <div className="actions">
            <button className="button" type="submit">
              Confirm lesson request
            </button>
            {submitted && hasErrors ? (
              <span className="form-status error">Fix the highlighted fields.</span>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

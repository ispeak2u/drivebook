"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  AdminApprovalStatus,
  InstructorProfileDraft,
  RoadTestSpecialization,
  VerificationStatus
} from "../lib/instructor-profile";
import {
  languageOptions,
  roadTestSpecializationOptions,
  torontoAreaOptions,
  validateInstructorProfile
} from "../lib/instructor-profile";
import { InstructorProfileCard } from "./instructor-profile-card";

const initialProfile: InstructorProfileDraft = {
  fullName: "",
  photoUrl: "",
  bio: "",
  languagesSpoken: [],
  areasServed: [],
  verificationStatus: "unverified",
  hourlyLessonRate: 55,
  vehicleType: "",
  yearsOfExperience: 0,
  roadTestSpecializations: [],
  adminApprovalStatus: "pending"
};

export function InstructorProfileForm() {
  const [profile, setProfile] = useState<InstructorProfileDraft>(initialProfile);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateInstructorProfile(profile), [profile]);
  const hasErrors = Object.keys(errors).length > 0;

  function updateField<K extends keyof InstructorProfileDraft>(
    field: K,
    value: InstructorProfileDraft[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function toggleArrayValue<K extends "languagesSpoken" | "areasServed">(
    field: K,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]
    }));
  }

  function toggleSpecialization(value: RoadTestSpecialization) {
    setProfile((current) => ({
      ...current,
      roadTestSpecializations: current.roadTestSpecializations.includes(value)
        ? current.roadTestSpecializations.filter((item) => item !== value)
        : [...current.roadTestSpecializations, value]
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="grid two">
      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="grid two">
            <TextField
              error={submitted ? errors.fullName : undefined}
              label="Full name"
              onChange={(value) => updateField("fullName", value)}
              placeholder="Maya Chen"
              value={profile.fullName}
            />
            <TextField
              error={submitted ? errors.photoUrl : undefined}
              label="Photo URL"
              onChange={(value) => updateField("photoUrl", value)}
              placeholder="https://example.com/photo.jpg"
              value={profile.photoUrl}
            />
          </div>

          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Describe your teaching style, lesson focus, and ideal student fit."
              value={profile.bio}
            />
            {submitted && errors.bio ? <span className="error-text">{errors.bio}</span> : null}
          </div>

          <CheckboxGroup
            error={submitted ? errors.languagesSpoken : undefined}
            label="Languages spoken"
            onToggle={(value) => toggleArrayValue("languagesSpoken", value)}
            options={languageOptions}
            selected={profile.languagesSpoken}
          />

          <CheckboxGroup
            error={submitted ? errors.areasServed : undefined}
            label="Areas served in Toronto"
            onToggle={(value) => toggleArrayValue("areasServed", value)}
            options={torontoAreaOptions}
            selected={profile.areasServed}
          />

          <div className="grid two">
            <div className="field">
              <label htmlFor="verificationStatus">License / verification status</label>
              <select
                id="verificationStatus"
                onChange={(event) =>
                  updateField("verificationStatus", event.target.value as VerificationStatus)
                }
                value={profile.verificationStatus}
              >
                <option value="unverified">Unverified</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="adminStatus">Admin approval status</label>
              <select
                id="adminStatus"
                onChange={(event) =>
                  updateField("adminApprovalStatus", event.target.value as AdminApprovalStatus)
                }
                value={profile.adminApprovalStatus}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid two">
            <NumberField
              error={submitted ? errors.hourlyLessonRate : undefined}
              label="Hourly lesson rate"
              min={1}
              onChange={(value) => updateField("hourlyLessonRate", value)}
              value={profile.hourlyLessonRate}
            />
            <NumberField
              error={submitted ? errors.yearsOfExperience : undefined}
              label="Years of experience"
              min={0}
              onChange={(value) => updateField("yearsOfExperience", value)}
              value={profile.yearsOfExperience}
            />
          </div>

          <TextField
            error={submitted ? errors.vehicleType : undefined}
            label="Vehicle type"
            onChange={(value) => updateField("vehicleType", value)}
            placeholder="Toyota Corolla, automatic"
            value={profile.vehicleType}
          />

          <CheckboxGroup
            error={submitted ? errors.roadTestSpecializations : undefined}
            label="Road test specialization"
            onToggle={(value) => toggleSpecialization(value as RoadTestSpecialization)}
            options={roadTestSpecializationOptions}
            selected={profile.roadTestSpecializations}
          />

          <div className="actions">
            <button className="button" type="submit">
              Validate profile
            </button>
            {submitted ? (
              <span className={hasErrors ? "form-status error" : "form-status success"}>
                {hasErrors ? "Fix the highlighted fields." : "Profile is ready for admin review."}
              </span>
            ) : null}
          </div>
        </form>
      </section>

      <div className="grid">
        <InstructorProfileCard profile={{ ...profile, id: "draft-profile" }} />
      </div>
    </div>
  );
}

function TextField({
  error,
  label,
  onChange,
  placeholder,
  value
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}

function NumberField({
  error,
  label,
  min,
  onChange,
  value
}: {
  error?: string;
  label: string;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}

function CheckboxGroup({
  error,
  label,
  onToggle,
  options,
  selected
}: {
  error?: string;
  label: string;
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
}) {
  return (
    <fieldset className="checkbox-group">
      <legend>{label}</legend>
      <div className="checkbox-grid">
        {options.map((option) => (
          <label className="checkbox-option" key={option}>
            <input
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              type="checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error ? <span className="error-text">{error}</span> : null}
    </fieldset>
  );
}

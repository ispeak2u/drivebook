import Link from "next/link";

export default function StudentSignupPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Student onboarding</span>
        <h1>Create a student account</h1>
        <p>Placeholder form for the MVP shell. Submission is not connected yet.</p>
      </header>

      <section className="panel">
        <form className="form">
          <div className="grid two">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" placeholder="Alex" />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" placeholder="Morgan" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" placeholder="alex@example.com" type="email" />
          </div>
          <div className="field">
            <label htmlFor="goal">Learning goal</label>
            <select id="goal" defaultValue="g2">
              <option value="g2">G2 road test prep</option>
              <option value="g">Full G road test prep</option>
              <option value="confidence">Confidence lessons</option>
            </select>
          </div>
          <div className="actions">
            <Link className="button" href="/student/dashboard">
              Preview dashboard
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}

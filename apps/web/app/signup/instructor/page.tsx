import Link from "next/link";

export default function InstructorSignupPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Instructor onboarding</span>
        <h1>Apply as an instructor</h1>
        <p>Placeholder intake for instructor profile and approval workflow.</p>
      </header>

      <section className="panel">
        <form className="form">
          <div className="grid two">
            <div className="field">
              <label htmlFor="businessName">Display name</label>
              <input id="businessName" placeholder="Maya Chen Driving" />
            </div>
            <div className="field">
              <label htmlFor="area">Primary service area</label>
              <input id="area" placeholder="North York" />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="transmission">Transmission</label>
              <select id="transmission" defaultValue="automatic">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="rate">Hourly rate</label>
              <input id="rate" placeholder="$58" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bio">Instructor bio</label>
            <textarea id="bio" placeholder="Short profile shown to students." />
          </div>
          <div className="actions">
            <Link className="button" href="/instructor/dashboard">
              Preview dashboard
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}

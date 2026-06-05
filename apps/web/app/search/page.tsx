import Link from "next/link";
import { instructors } from "../../lib/placeholder-data";

export default function SearchInstructorsPage() {
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Search instructors</span>
        <h1>Find a driving instructor</h1>
        <p>Browse placeholder instructor cards by area, car type, rating, and next slot.</p>
      </header>

      <section className="panel" style={{ marginBottom: 14 }}>
        <form className="grid three">
          <div className="field">
            <label htmlFor="area">Area</label>
            <input id="area" placeholder="North York" />
          </div>
          <div className="field">
            <label htmlFor="transmission">Transmission</label>
            <select id="transmission" defaultValue="any">
              <option value="any">Any</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="date">Preferred date</label>
            <input id="date" type="date" />
          </div>
        </form>
      </section>

      <section className="grid three">
        {instructors.map((instructor) => (
          <article className="panel instructor-card" key={instructor.id}>
            <div className="card-top">
              <div style={{ display: "flex", gap: 12 }}>
                <span className="avatar">{instructor.name.slice(0, 1)}</span>
                <div>
                  <h2>{instructor.name}</h2>
                  <p>{instructor.area}</p>
                </div>
              </div>
              <span className="badge">{instructor.price}</span>
            </div>
            <div className="inline-meta">
              <span>{instructor.vehicle}</span>
              <span>{instructor.transmission}</span>
              <span>{instructor.rating} rating</span>
            </div>
            <p>Next slot: {instructor.nextSlot}</p>
            <Link className="button" href="/booking">
              Book lesson
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}

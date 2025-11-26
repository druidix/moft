import { useEffect, useState } from "react";

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [box, setBox] = useState({
    lamin: 33.5,
    lomin: -119.0,
    lamax: 34.5,
    lomax: -117.5,
  });

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams(box).toString();

      const res = await fetch(`http://localhost:4000/api/flights?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // data.states is array of arrays; transform to nicer objects
      const transformed =
        data.states?.map((s) => ({
          icao24: s[0],
          callsign: s[1]?.trim() || "N/A",
          originCountry: s[2],
          longitude: s[5],
          latitude: s[6],
          altitude: s[13] ?? s[7], // prefer geo_altitude, fall back to baro
          velocity: s[9],
        })) ?? [];

      setFlights(transformed);
    } catch (err) {
      console.error(err);
      setError("Failed to load flights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []); // run once on load

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBox((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const formatNumber = (n, digits = 2) =>
    typeof n === "number" ? n.toFixed(digits) : "—";

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Beginner Flight Tracker</h1>
      <p style={{ maxWidth: 600 }}>
        This app uses the OpenSky API to list aircraft in a latitude/longitude
        bounding box.
      </p>

      <section
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Bounding Box</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          {["lamin", "lomin", "lamax", "lomax"].map((field) => (
            <label key={field} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, textTransform: "uppercase" }}>
                {field}
              </span>
              <input
                name={field}
                value={box[field]}
                onChange={handleChange}
                type="number"
                step="0.1"
              />
            </label>
          ))}
        </div>
        <button onClick={fetchFlights} disabled={loading}>
          {loading ? "Loading..." : "Refresh flights"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </section>

      <section>
        <h2>
          Flights{" "}
          <span style={{ fontSize: 14, fontWeight: "normal" }}>
            ({flights.length} found)
          </span>
        </h2>
        <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: "600px",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th>Callsign</th>
                <th>ICAO24</th>
                <th>Country</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Altitude (m)</th>
                <th>Speed (m/s)</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => (
                <tr key={f.icao24 + f.callsign}>
                  <td>{f.callsign}</td>
                  <td>{f.icao24}</td>
                  <td>{f.originCountry}</td>
                  <td>{formatNumber(f.latitude)}</td>
                  <td>{formatNumber(f.longitude)}</td>
                  <td>{formatNumber(f.altitude, 0)}</td>
                  <td>{formatNumber(f.velocity)}</td>
                </tr>
              ))}
              {!loading && flights.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "1rem" }}>
                    No flights found in this box.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;

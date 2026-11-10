export function Guide() {
  return (
    <div className="guide">
      <h1>License requirements</h1>
      <p className="muted">
        A summary of how US amateur licensing works. Rules and fees change, so confirm the details with the FCC and your exam team before test day.
      </p>

      <div className="card">
        <h3>The three license classes</h3>
        <table className="table">
          <thead>
            <tr><th>License</th><th>Exam</th><th>Questions</th><th>To pass</th><th>Current pool</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Technician</strong></td><td>Element 2</td><td>35</td><td>26</td><td>2026-2030 (7/1/2026-6/30/2030)</td></tr>
            <tr><td>General</td><td>Element 3</td><td>35</td><td>26</td><td>2023-2027 (through 6/30/2027)</td></tr>
            <tr><td>Amateur Extra</td><td>Element 4</td><td>50</td><td>37</td><td>2024-2028 (through 6/30/2028)</td></tr>
          </tbody>
        </table>
        <ul>
          <li>Each license builds on the one before it. To get General, you must hold (or pass at the same session) Technician.</li>
          <li>Each exam takes one question from every group in the pool. The pools are public, so every possible question is in this app.</li>
          <li>There is no Morse code requirement and no minimum age.</li>
          <li>You can take the next element at the same session after passing one, usually for no extra fee.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Steps to get licensed</h3>
        <ol>
          <li><strong>Get an FRN.</strong> Register for a free FCC Registration Number in the FCC's CORES system (apps.fcc.gov/cores). You need it to take the exam.</li>
          <li><strong>Find an exam session.</strong> Volunteer Examiner (VE) teams run exams in person and online. Search the ARRL exam session finder, HamStudy.org, or remote exam providers such as Laurel VEC or GLAARG.</li>
          <li><strong>Take the exam.</strong> Bring a photo ID, your FRN, and the session fee if there is one (VEC fees vary, and some sessions are free). Calculators are generally allowed if their memory is cleared.</li>
          <li><strong>Pay the FCC fee.</strong> After you pass, the FCC emails you a link to pay the $35 application fee in CORES. Your application isn't processed until you pay.</li>
          <li><strong>Wait for your call sign.</strong> Once your license appears in the FCC ULS database, you may transmit. The FCC emails you a link to download your official license.</li>
        </ol>
      </div>

      <div className="card">
        <h3>Technician privileges at a glance</h3>
        <table className="table">
          <thead><tr><th>Band</th><th>Frequencies</th><th>Modes</th></tr></thead>
          <tbody>
            <tr><td>80 m</td><td>3.525-3.600 MHz</td><td>CW only</td></tr>
            <tr><td>40 m</td><td>7.025-7.125 MHz</td><td>CW only</td></tr>
            <tr><td>15 m</td><td>21.025-21.200 MHz</td><td>CW only</td></tr>
            <tr><td>10 m</td><td>28.000-28.300 MHz</td><td>CW, RTTY/data</td></tr>
            <tr><td>10 m</td><td>28.300-28.500 MHz</td><td>CW, phone (SSB)</td></tr>
            <tr><td>6 m and up</td><td>All amateur frequencies above 50 MHz</td><td>All modes</td></tr>
          </tbody>
        </table>
        <p className="muted small">Power limits: 200 W PEP on the HF segments and up to 1500 W PEP above 30 MHz. Always use the minimum power necessary.</p>
      </div>

      <div className="card">
        <h3>Exam structure: where the 35 questions come from</h3>
        <table className="table">
          <tbody>
            <tr><td>T1 Commission's Rules</td><td>6</td></tr>
            <tr><td>T2 Operating Procedures</td><td>3</td></tr>
            <tr><td>T3 Radio Wave Propagation</td><td>3</td></tr>
            <tr><td>T4 Amateur Radio Practices</td><td>2</td></tr>
            <tr><td>T5 Electrical Principles</td><td>4</td></tr>
            <tr><td>T6 Electronic and Electrical Components</td><td>4</td></tr>
            <tr><td>T7 Practical Circuits</td><td>4</td></tr>
            <tr><td>T8 Signals and Emissions</td><td>4</td></tr>
            <tr><td>T9 Antennas and Feed Lines</td><td>2</td></tr>
            <tr><td>T0 Safety</td><td>3</td></tr>
          </tbody>
        </table>
        <p className="muted small">Rules (T1) carry the most weight. Math questions (Ohm's law, power, dB, unit conversions) in T5 are reliable points once you learn the formulas.</p>
      </div>

      <div className="card">
        <h3>Sources</h3>
        <ul>
          <li>Question pool: NCVEC Question Pool Committee, 2026-2030 Technician pool (public domain), revision of Feb 19, 2026 including errata.</li>
          <li>Rules: 47 CFR Part 97 (eCFR.gov).</li>
          <li>The explanations in this app are original and AI-assisted. Use the ☆ flag on any explanation that looks wrong, and check against Part 97 or the ARRL Ham Radio License Manual.</li>
        </ul>
      </div>
    </div>
  )
}

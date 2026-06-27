// ---------- Campaign concepts data ----------
const concepts = [
  { title: "Golden Hour Pour", desc: "Slow-motion pour over ice at sunset, condensation dripping down the glass." },
  { title: "First Sip", desc: "Close-up on a face at the first sip — eyes closing, shoulders dropping." },
  { title: "Rooftop Refresh", desc: "City skyline at dusk, a sweating can on the ledge, the day finally exhaling." },
  { title: "Minimalist Studio", desc: "Clean white studio, the can rotating slowly under a single hard light." },
  { title: "Beach Cooler", desc: "A cooler lid lifts on the sand — ice, cans, and the ocean just beyond." },
  { title: "Office Break", desc: "A two-minute pause in a quiet break room, can sweating on the counter." },
  { title: "Night Drive", desc: "Convertible at dusk, the can in the cupholder, neon sliding across the glass." },
  { title: "Picnic Table", desc: "Outdoor brunch, soft natural light, the can beside fresh-cut citrus." },
  { title: "Gym Recovery", desc: "Post-workout stillness — the can against a bag, condensation beading." },
  { title: "Kitchen Counter", desc: "Marble counter, a citrus garnish, morning light through the window." },
  { title: "Festival Crowd", desc: "A hand lifts the can at golden hour, the crowd blurred behind it." },
  { title: "Macro Bubbles", desc: "Extreme close-up on rising carbonation — slow, tactile, almost meditative." },
];

function renderConcepts() {
  const track = document.getElementById("concepts-track");
  if (!track) return;

  const html = concepts.map((c, i) => `
    <article class="concept-card">
      <p class="concept-index">${String(i + 1).padStart(2, "0")} / 12</p>
      <h3 class="concept-title">${c.title}</h3>
      <p class="concept-desc">${c.desc}</p>
    </article>
  `).join("");

  track.innerHTML = html;
}
renderConcepts();

// ---------- Email signup (Supabase) ----------
const SUPABASE_URL = window.__FIZZ_ENV__?.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.__FIZZ_ENV__?.SUPABASE_ANON_KEY || "";

const form = document.getElementById("signup-form");
const emailInput = document.getElementById("email-input");
const statusEl = document.getElementById("form-status");
const btn = document.getElementById("signup-btn");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!email) return;

  btn.disabled = true;
  btn.textContent = "Submitting…";
  statusEl.textContent = "";
  statusEl.classList.remove("error");

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("not_configured");
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "request_failed");
    }

    statusEl.textContent = "You're on the list. We'll be in touch.";
    emailInput.value = "";
  } catch (err) {
    console.error(err);
    if (err.message === "not_configured") {
      statusEl.textContent = "Signup isn't connected yet — try again soon.";
    } else if (String(err.message).includes("duplicate")) {
      statusEl.textContent = "That email's already on the list.";
    } else {
      statusEl.textContent = "Something went wrong. Please try again.";
      statusEl.classList.add("error");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Notify Me";
  }
});

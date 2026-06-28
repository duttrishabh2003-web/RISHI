import { colorways } from "./laptop3d.js";

function renderSwatches() {
  const container = document.getElementById("swatches");
  if (!container) return;

  container.innerHTML = colorways.map((c, i) => `
    <button class="swatch ${i === 0 ? "active" : ""}" data-index="${i}" type="button">
      <span class="swatch-dot" style="background:#${c.hex.toString(16).padStart(6, "0")}"></span>
      ${c.name}
    </button>
  `).join("");

  container.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      window.__setLaptopColor?.(idx);
      container.querySelectorAll(".swatch").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedColorway = colorways[idx].name;
    });
  });
}

let selectedColorway = colorways[0].name;

// wait a tick for the module to be ready
requestAnimationFrame(renderSwatches);

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
  btn.textContent = "Reserving…";
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
      body: JSON.stringify({ email, colorway: selectedColorway }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "request_failed");
    }

    statusEl.textContent = `You're reserved for ${selectedColorway}. We'll be in touch.`;
    emailInput.value = "";
  } catch (err) {
    console.error(err);
    if (err.message === "not_configured") {
      statusEl.textContent = "Reservations aren't connected yet — try again soon.";
    } else if (String(err.message).includes("duplicate")) {
      statusEl.textContent = "That email's already reserved.";
    } else {
      statusEl.textContent = "Something went wrong. Please try again.";
      statusEl.classList.add("error");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Reserve";
  }
});

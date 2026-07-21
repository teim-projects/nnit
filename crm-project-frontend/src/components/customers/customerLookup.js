// customerLookup.js
// Uses /lead/customer/lookup/ which searches ALL customers (including
// is_lead_only=True ones created from leads), so phone-number lookup
// in the lead form finds existing records correctly.

export async function fetchCustomerByQuery(baseApi, token, query, options = {}) {
  if (!query || query.trim() === "") return null;

  const url = `${baseApi.replace(/\/$/, "")}/lead/customer/lookup/?search=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: options.signal,
    });

    if (!res.ok) return null;

    const json = await res.json();
    const results = Array.isArray(json) ? json : json.results ?? [];

    if (results.length > 0) {
      return results[0];
    }

    return null;
  } catch (err) {
    if (err?.name !== "AbortError") {
      console.error("Customer lookup error:", err);
    }
    return null;
  }
}

const KIT_API_BASE_URL = "https://api.convertkit.com/v3";
const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Send a JSON response from the serverless function.
 * @param {import("http").ServerResponse} response - Node response object.
 * @param {number} statusCode - HTTP status code.
 * @param {object} payload - JSON response payload.
 * @returns {void}
 */
const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

/** Read a bounded request body string.
 * @param {import("http").IncomingMessage} request - Node request object.
 * @returns {Promise<string>} Request body text.
 */
const readBody = async (request) => {
  if (typeof request.body === "string") {
    return request.body;
  }

  if (request.body && typeof request.body === "object") {
    return JSON.stringify(request.body);
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      throw new Error("request_body_too_large");
    }
  }
  return body;
};

/** Normalize newsletter source metadata before sending it to Kit.
 * @param {unknown} source - Raw source field from the client.
 * @returns {string} Safe source label.
 */
const normalizeSource = (source) => {
  if (typeof source !== "string") {
    return "ai-news";
  }
  return source.replace(/[^\w-]/g, "").slice(0, 40) || "ai-news";
};

/** Subscribe an email address to the configured Kit form.
 * @param {string} email - Subscriber email address.
 * @param {string} source - Newsletter source label.
 * @returns {Promise<void>} Resolves when Kit accepts the subscription.
 */
const subscribeToKit = async (email, source) => {
  const formId = process.env.KIT_FORM_ID;
  const apiKey = process.env.KIT_API_KEY;

  if (!formId || !apiKey) {
    throw new Error("kit_not_configured");
  }

  const kitResponse = await fetch(`${KIT_API_BASE_URL}/forms/${encodeURIComponent(formId)}/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      api_key: apiKey,
      email,
      fields: {
        source,
      },
    }),
  });

  if (!kitResponse.ok) {
    throw new Error(`kit_request_failed_${kitResponse.status}`);
  }
};

/** Vercel serverless function for AI News subscriptions.
 * @param {import("http").IncomingMessage & { body?: unknown }} request - Incoming request.
 * @param {import("http").ServerResponse} response - Outgoing response.
 * @returns {Promise<void>} Resolves after the response is sent.
 */
export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  try {
    const payload = JSON.parse(await readBody(request));
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const source = normalizeSource(payload.source);

    if (payload.website) {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      sendJson(response, 400, { error: "invalid_email" });
      return;
    }

    await subscribeToKit(email, source);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const statusCode = message === "kit_not_configured" ? 503 : 500;
    sendJson(response, statusCode, { error: statusCode === 503 ? "subscription_not_configured" : "subscription_failed" });
  }
}

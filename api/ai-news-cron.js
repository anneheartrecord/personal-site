const GITHUB_API_BASE_URL = "https://api.github.com";
const DEFAULT_REPOSITORY = "anneheartrecord/personal-site";
const DEFAULT_WORKFLOW_FILE = "ai-news-generate.yml";
const DEFAULT_REF = "main";

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

/** Verify that the request came from Vercel Cron or a trusted caller.
 * @param {import("http").IncomingMessage} request - Incoming request.
 * @returns {boolean} True when the authorization header matches CRON_SECRET.
 */
const isAuthorizedCronRequest = (request) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  return request.headers.authorization === `Bearer ${cronSecret}`;
};

/** Trigger the AI News GitHub Actions workflow.
 * @returns {Promise<void>} Resolves after GitHub accepts the workflow dispatch.
 */
const dispatchAiNewsWorkflow = async () => {
  const token = process.env.GITHUB_WORKFLOW_DISPATCH_TOKEN;
  if (!token) {
    throw new Error("github_workflow_dispatch_token_not_configured");
  }

  const repository = process.env.GITHUB_WORKFLOW_REPOSITORY || DEFAULT_REPOSITORY;
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE || DEFAULT_WORKFLOW_FILE;
  const workflowRef = process.env.GITHUB_WORKFLOW_REF || DEFAULT_REF;
  const response = await fetch(
    `${GITHUB_API_BASE_URL}/repos/${repository}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref: workflowRef,
        inputs: {
          force: "false",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`github_workflow_dispatch_failed_${response.status}:${errorBody.slice(0, 300)}`);
  }
};

/** Vercel Cron endpoint that dispatches the AI News generation workflow.
 * @param {import("http").IncomingMessage} request - Incoming request.
 * @param {import("http").ServerResponse} response - Outgoing response.
 * @returns {Promise<void>} Resolves after response is sent.
 */
export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  if (!isAuthorizedCronRequest(request)) {
    sendJson(response, 401, { error: "unauthorized" });
    return;
  }

  try {
    await dispatchAiNewsWorkflow();
    sendJson(response, 200, {
      ok: true,
      workflow: process.env.GITHUB_WORKFLOW_FILE || DEFAULT_WORKFLOW_FILE,
      ref: process.env.GITHUB_WORKFLOW_REF || DEFAULT_REF,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    sendJson(response, 500, { error: "dispatch_failed", message });
  }
}

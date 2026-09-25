import { API_ORIGIN } from "./config.js";

async function api(path, options = {}) {
  const { session } = await chrome.storage.session.get("session");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session) headers.Authorization = `Bearer ${session}`;
  const response = await fetch(`${API_ORIGIN}${path}`, { ...options, headers });
  if (!response.ok && response.status !== 204) throw new Error((await response.json().catch(() => ({ error: "Request failed" }))).error);
  return response.status === 204 ? null : response.json();
}

async function artifactDataUrl(path, mimeType) {
  const { session } = await chrome.storage.session.get("session");
  const response = await fetch(`${API_ORIGIN}${path}`, { headers: { Authorization: `Bearer ${session}` } });
  if (!response.ok) throw new Error("Artifact download failed.");
  const bytes = new Uint8Array(await response.arrayBuffer()); let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return `data:${mimeType};base64,${btoa(binary)}`;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "demo-login") {
      const result = await fetch(`${API_ORIGIN}/v1/auth/demo`).then((response) => response.json());
      await chrome.storage.session.set({ session: result.session }); return { ok: true, demo: true };
    }
    if (message.type === "google-login") {
      const redirect = chrome.identity.getRedirectURL("oauth2");
      const { authorizationUrl } = await api(`/v1/auth/google/start?redirect=${encodeURIComponent(redirect)}`);
      const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authorizationUrl, interactive: true });
      const fragment = new URL(responseUrl).hash.slice(1); const session = new URLSearchParams(fragment).get("session");
      if (!session) throw new Error("Sign-in did not return a session."); await chrome.storage.session.set({ session }); return { ok: true };
    }
    if (message.type === "coursework") return { ok: true, ...(await api("/v1/coursework")) };
    if (message.type === "create-job") return { ok: true, ...(await api("/v1/learning-jobs", { method: "POST", headers: { "Idempotency-Key": message.payload.idempotencyKey }, body: JSON.stringify(message.payload) })) };
    if (message.type === "get-job") return { ok: true, ...(await api(`/v1/learning-jobs/${encodeURIComponent(message.id)}`)) };
    if (message.type === "download-artifact") return { ok: true, dataUrl: await artifactDataUrl(`/v1/learning-jobs/${encodeURIComponent(message.jobId)}/artifacts/${encodeURIComponent(message.filename)}`, message.mimeType) };
    if (message.type === "disconnect") { await api("/v1/connection", { method: "DELETE" }); await chrome.storage.session.remove("session"); return { ok: true }; }
    throw new Error("Unsupported action");
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

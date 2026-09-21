const $ = (selector) => document.querySelector(selector);
const send = (message) => chrome.runtime.sendMessage(message);
const status = (text) => { $("#status").textContent = text; };

function showSignedIn(value) { $("#signed-out").classList.toggle("hidden", value); $("#signed-in").classList.toggle("hidden", !value); }
function renderArtifact(artifact) { const root = $("#result"); root.replaceChildren(); const heading = document.createElement("h3"); heading.textContent = artifact.summary; const list = document.createElement("ul"); artifact.steps.forEach((step) => { const item = document.createElement("li"); item.textContent = step; list.append(item); }); const note = document.createElement("p"); const label = document.createElement("strong"); label.textContent = "Keep it yours: "; note.append(label, artifact.integrityNote); root.append(heading, list, note); root.classList.remove("hidden"); }
async function loadCoursework() { const result = await send({ type: "coursework" }); if (!result.ok) throw new Error(result.error); const select = $("#coursework"); select.replaceChildren(); result.items.forEach((item) => { const option = document.createElement("option"); option.value = item.id; option.textContent = item.title; select.append(option); }); }
async function signIn(type) { status("Signing in…"); const result = await send({ type }); if (!result.ok) throw new Error(result.error); await loadCoursework(); showSignedIn(true); status(result.demo ? "Local demo connected." : "Connected with read-only access."); }

$("#google-login").onclick = () => signIn("google-login").catch((error) => status(error.message));
$("#demo-login").onclick = () => signIn("demo-login").catch((error) => status(error.message));
$("#disconnect").onclick = async () => { const result = await send({ type: "disconnect" }); if (result.ok) { showSignedIn(false); status(""); } else status(result.error); };
$("#create-job").onclick = async () => {
  if (!$("#consent").checked) return status("Confirm consent before creating a learning aid.");
  status("Creating your learning aid…"); $("#result").classList.add("hidden");
  const selected = $("#coursework").selectedOptions[0]; const payload = { courseworkId: $("#coursework").value, mode: $("#mode").value, context: { title: selected?.textContent || "Selected assignment", instructions: $("#instructions").value || undefined }, consent: true, idempotencyKey: crypto.randomUUID() };
  const created = await send({ type: "create-job", payload }); if (!created.ok) return status(created.error);
  for (let i = 0; i < 15; i += 1) { await new Promise((resolve) => setTimeout(resolve, 900)); const current = await send({ type: "get-job", id: created.job.id }); if (current.ok && current.job.state === "succeeded") { renderArtifact(current.job.result); return status("Ready."); } }
  status("Still preparing your aid. Keep this popup open and try again shortly.");
};

chrome.storage.session.get("session").then(async ({ session }) => { if (!session) return; try { await loadCoursework(); showSignedIn(true); } catch { await chrome.storage.session.remove("session"); } });

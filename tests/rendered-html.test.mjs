import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /class="mapViewport"/);
  assert.match(html, /Interactive global operational map/);
  assert.match(html, /class="openingDecision"/);
  assert.match(html, /NOTICE/);
  assert.match(html, /CLARIFY/);
  assert.match(html, /DECIDE/);
  assert.match(html, /COMMIT/);
  assert.match(html, /LEARN/);
  assert.match(html, /Escort shipping/);
  assert.match(html, /Maintain shadow/);
  assert.match(html, /Build coalition convoy/);
});

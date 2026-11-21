"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"));
const supportedLanguages = new Set(["lug", "nyn", "ach"]);
const maxRequestBytes = 16 * 1024;

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxRequestBytes) {
      return { tooLarge: true };
    }
    chunks.push(chunk);
  }
  try {
    return { body: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { invalidJson: true };
  }
}

async function translate(request, response) {
  const parsed = await readJsonBody(request);
  if (parsed.tooLarge) {
    sendJson(response, 413, { error: "Request is too large." });
    return;
  }
  if (parsed.invalidJson) {
    sendJson(response, 400, { error: "Request must contain valid JSON." });
    return;
  }

  const { source_language, target_language, text } = parsed.body || {};
  if (
    source_language !== "eng" ||
    !supportedLanguages.has(target_language) ||
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 5000
  ) {
    sendJson(response, 400, { error: "Invalid translation request." });
    return;
  }

  const token = process.env.SUNBIRD_API_TOKEN;
  if (!token) {
    sendJson(response, 503, { error: "Translation is not configured." });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const upstreamResponse = await fetch("https://api.sunbird.ai/tasks/translate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ source_language, target_language, text }),
      signal: controller.signal
    });
    if (!upstreamResponse.ok) {
      sendJson(response, 502, { error: "Translation service request failed." });
      return;
    }

    const upstreamData = await upstreamResponse.json();
    const translatedText = upstreamData?.output?.translated_text;
    if (
      typeof translatedText !== "string" ||
      !translatedText.trim() ||
      translatedText.includes(token)
    ) {
      sendJson(response, 502, { error: "Translation service returned no usable translation." });
      return;
    }

    sendJson(response, 200, { translated_text: translatedText });
  } catch {
    if (!response.writableEnded) {
      sendJson(response, 502, { error: "Translation service is unavailable." });
    }
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/" && request.method === "GET") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(indexHtml);
    return;
  }

  if (pathname === "/api/translate") {
    if (request.method !== "POST") {
      response.writeHead(405, { Allow: "POST", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Method not allowed.");
      return;
    }
    await translate(request, response);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found.");
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";
server.listen(port, host, () => {
  console.log(`know_uganda listening on http://${host}:${port}`);
});

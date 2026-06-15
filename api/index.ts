import type { IncomingMessage, ServerResponse } from "http";

/**
 * Vercel serverless function that wraps the TanStack Start server handler.
 * The server handler uses the Web Fetch API (Request → Response),
 * so we adapt Vercel's Node.js HTTP objects to/from that interface.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    // Dynamically import the built server entry
    const serverModule = await import("../dist/server/server.js");
    const serverHandler = serverModule.default ?? serverModule;

    // Build the full URL from the incoming request
    const protocol =
      (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    // Convert Node.js headers to Web Headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(
          key,
          Array.isArray(value) ? value.join(", ") : String(value),
        );
      }
    }

    // Read the request body for methods that have one
    let body: BodyInit | null = null;
    if (req.method && ["POST", "PUT", "PATCH"].includes(req.method)) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    // Create a Web Fetch Request
    const fetchRequest = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start server handler
    const response = await serverHandler.fetch(fetchRequest, {}, {});

    // Write the response back to Vercel's Node.js response
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    console.error("Vercel serverless function error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html><body><h1>Internal Server Error</h1></body></html>`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
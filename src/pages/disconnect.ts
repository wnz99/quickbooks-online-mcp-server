export function getDisconnectHtml(realmId: string | null): string {
  const realmInfo = realmId
    ? `<p>Company ID: <strong>${realmId}</strong></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disconnected - QBO MCP Server</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 80vh; text-align: center; }
    h1 { color: #d32f2f; }
    p { color: #666; }
    .status { background: #fff5f5; border: 1px solid #d32f2f; border-radius: 8px; padding: 1.5rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Disconnected from QuickBooks</h1>
  <div class="status">
    <p>Your QuickBooks Online account has been disconnected from this MCP server.</p>
    ${realmInfo}
    <p>To reconnect, re-authorize the app through QuickBooks Online.</p>
  </div>
</body>
</html>`;
}

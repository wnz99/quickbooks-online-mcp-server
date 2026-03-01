export const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - QBO MCP Server</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #2E8B57; padding-bottom: 0.5rem; }
    h2 { color: #2E8B57; margin-top: 2rem; }
    p { margin: 0.75rem 0; }
    .updated { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: March 1, 2026</p>

  <p>This Privacy Policy describes how the QuickBooks Online MCP Server ("Service") handles your information when you use the software to connect to QuickBooks Online.</p>

  <h2>1. Information We Access</h2>
  <p>The Service accesses your QuickBooks Online data solely through the QuickBooks API using OAuth 2.0 credentials that you provide. This may include:</p>
  <p>(a) Company information, customers, vendors, employees, and other accounting entities;</p>
  <p>(b) Financial data such as invoices, bills, payments, journal entries, and reports;</p>
  <p>(c) OAuth tokens (access token and refresh token) required for API authentication.</p>

  <h2>2. How We Use Your Information</h2>
  <p>Your QuickBooks data is used exclusively to fulfill your requests through the MCP protocol. The Service:</p>
  <p>(a) Passes your data between your AI tools and QuickBooks Online;</p>
  <p>(b) Does not analyze, aggregate, or use your data for any purpose other than fulfilling your requests;</p>
  <p>(c) Does not train AI models on your data.</p>

  <h2>3. Data Storage</h2>
  <p>The Service stores only the minimum data required for operation:</p>
  <p>(a) OAuth refresh tokens are stored in your server's environment configuration to maintain your QuickBooks connection;</p>
  <p>(b) Access tokens are held in memory only for the duration of active sessions;</p>
  <p>(c) No QuickBooks business data is persisted to disk or any database.</p>

  <h2>4. Data Sharing</h2>
  <p>We do not sell, trade, or share your data with third parties. Your data is transmitted only between:</p>
  <p>(a) Your MCP client (e.g., Claude Desktop) and this Service;</p>
  <p>(b) This Service and QuickBooks Online API (Intuit).</p>

  <h2>5. Security</h2>
  <p>The Service employs the following security measures:</p>
  <p>(a) OAuth 2.0 for secure authentication with QuickBooks;</p>
  <p>(b) HTTPS for all communications with QuickBooks API;</p>
  <p>(c) No logging or storage of sensitive financial data.</p>
  <p>You are responsible for securing access to your deployed instance of the Service, including network access controls and environment variable protection.</p>

  <h2>6. Your Rights</h2>
  <p>You may at any time:</p>
  <p>(a) Revoke the Service's access to your QuickBooks account through the Intuit Developer Portal or QuickBooks settings;</p>
  <p>(b) Delete your OAuth tokens from the server environment;</p>
  <p>(c) Stop using the Service entirely.</p>

  <h2>7. Third-Party Services</h2>
  <p>The Service connects to QuickBooks Online, which is operated by Intuit Inc. Your use of QuickBooks Online is subject to <a href="https://www.intuit.com/privacy/" target="_blank" rel="noopener">Intuit's Privacy Policy</a>.</p>

  <h2>8. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. Changes will be reflected in the "Last updated" date above. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>

  <h2>9. Contact</h2>
  <p>For privacy-related questions or concerns, please open an issue on the project's GitHub repository.</p>
</body>
</html>`;

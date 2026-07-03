const messages = {
  yes: "❤️ **Chiggi clicked YES**",
  no: "💙 **Chiggi clicked NO**",
};

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured");
    return response
      .status(500)
      .json({ error: "Discord webhook is not configured" });
  }

  const { answer, timestamp } = request.body || {};
  if (!Object.prototype.hasOwnProperty.call(messages, answer)) {
    return response.status(400).json({ error: "Invalid answer" });
  }

  const content = `${messages[answer]}\n\n🕒 Time: ${
    timestamp || new Date().toLocaleString()
  }\n\n🌐 Source:\nConfession Website`;

  const discordResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!discordResponse.ok) {
    const errorText = await discordResponse.text();
    console.error("Discord webhook request failed", {
      status: discordResponse.status,
      body: errorText,
    });
    return response.status(502).json({ error: "Discord webhook request failed" });
  }

  return response.status(204).end();
};

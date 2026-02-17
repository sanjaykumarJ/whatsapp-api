const express = require("express");
const bodyParser = require("body-parser");
const { saveMessageToCrm, getAllCrmRecords } = require("./crm");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "change-me-verify-token";

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * WhatsApp webhook verification (GET)
 *
 * Meta will call this with query params:
 * - 'hub.mode'
 * - 'hub.verify_token'
 * - 'hub.challenge'
 */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
console.log(VERIFY_TOKEN, token, challenge);
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WEBHOOK] Verification successful");
    return res.status(200).send(challenge);
  }

  console.warn("[WEBHOOK] Verification failed", { mode, token });
  return res.sendStatus(403);
});

/**
 * WhatsApp incoming messages (POST)
 * Body format: WhatsApp Cloud API webhook payload.
 */
app.post("/webhook", (req, res) => {
  const body = req.body;

  console.log("[WEBHOOK] Incoming payload:", JSON.stringify(body, null, 2));

  // Basic validation
  if (!body || body.object !== "whatsapp_business_account") {
    return res.sendStatus(404);
  }

  try {
    const entries = body.entry || [];
    entries.forEach((entry) => {
      const changes = entry.changes || [];
      changes.forEach((change) => {
        const value = change && change.value ? change.value : {};

        const contacts = value.contacts || [];
        const messages = value.messages || [];

        messages.forEach((message) => {
          const from = message.from; // phone number
          const timestamp = message.timestamp;
          const textBody = message.text && message.text.body ? message.text.body : null;

          if (!textBody) {
            console.log("[WEBHOOK] Non-text message received, skipping CRM store");
            return;
          }

          const firstContact = contacts.length > 0 ? contacts[0] : {};
          const contactProfile = firstContact.profile || {};
          const name = contactProfile.name || null;

          saveMessageToCrm({
            from,
            name,
            message: textBody,
            timestamp,
            raw: message,
          });
        });
      });
    });
  } catch (err) {
    console.error("[WEBHOOK] Error processing webhook:", err);
  }

  // Always respond quickly with 200 so WhatsApp is satisfied.
  res.sendStatus(200);
});

/**
 * Simple endpoint to view stored CRM records (debug only).
 * DO NOT expose this publicly in production.
 */
app.get("/crm/records", (req, res) => {
  res.json(getAllCrmRecords());
});

app.listen(PORT, () => {
  console.log(`WhatsApp webhook server listening on port ${PORT}`);
});

module.exports = app;


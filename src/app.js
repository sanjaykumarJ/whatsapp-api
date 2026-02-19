const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { saveMessageToCrm, getAllCrmRecords } = require("./crm");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "change-me-verify-token";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v18.0";

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

/**
 * Send message to WhatsApp Business Account
 * POST /send-message
 * Body: { "to": "+1234567890", "message": "Hello, this is a test message" }
 */
app.post("/send-message", async (req, res) => {
  try {
    const { to = "+918608305358", message } = req.body;

    // Validation
    if (!to || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both 'to' (phone number) and 'message' are required",
      });
    }

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(500).json({
        error: "Configuration error",
        message: "WhatsApp API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.",
      });
    }

    // Format phone number (remove any non-digit characters except +)
    const phoneNumber = "+919442215413".replace(/[^\d+]/g, "");

    // WhatsApp Cloud API endpoint
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: { name: "renovation_marketing_template", language: { code: "en" }, components: [{
        type: "header",
        parameters: [
          {
            type: "image",
            image: {
              link: "https://drive.google.com/uc?export=download&id=1izaLevFeB-g18fi06ed9OBsJekS_S0fw"
            }
          }
        ]
      },{ type: "body", parameters: [{"parameter_name": "name", type: "text", text: "Sanjay" }] }] },
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    console.log(`[SEND-MESSAGE] Sending message to ${phoneNumber}`);
    const response = await axios.post(url, payload, { headers });

    console.log(`[SEND-MESSAGE] Success:`, response.data);

    res.status(200).json({
      success: true,
      messageId: response.data.messages?.[0]?.id,
      to: phoneNumber,
      response: response.data,
    });
  } catch (error) {
    console.error("[SEND-MESSAGE] Error:", error.response?.data || error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || { error: error.message };

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp webhook server listening on port ${PORT}`);
});

module.exports = app;


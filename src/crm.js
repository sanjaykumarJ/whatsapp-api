// Simple in-memory CRM storage.
// Replace this with your actual CRM API integration (HubSpot, Salesforce, custom DB, etc.).
const { appendRow } = require("./googleSheets");

/**
 * Save a WhatsApp message into the CRM.
 * @param {Object} payload
 * @param {string} payload.from - WhatsApp phone number (without +).
 * @param {string} payload.name - Contact name if available.
 * @param {string} payload.message - Text message body.
 * @param {string} payload.timestamp - UNIX timestamp from WhatsApp.
 * @param {Object} [payload.raw] - Raw WhatsApp message object.
 * @returns {Object} The stored lead / interaction record.
 */
async function saveMessageToCrm(payload) {
  const record = {
    id: `${payload.from}-${payload.timestamp}`,
    from: payload.from,
    name: payload.name || null,
    message: payload.message,
    timestamp: payload.timestamp,
    raw: payload.raw || null,
    createdAt: new Date().toISOString(),
  };

  try {
    console.log({record});
    
    const response = await appendRow('Sheet1!A1:F1', [record.id, record.from, record.name, record.message, record.timestamp]);
    console.log("[CRM] Stored WhatsApp message in CRM store:", response);
    return response;
  } catch (error) {
    console.error("[CRM] Error storing WhatsApp message in CRM store:", error);
    return null;
  }
}

/**
 * Retrieve all stored CRM records (for debugging).
 */
function getAllCrmRecords() {
  return leads;
}

module.exports = {
  saveMessageToCrm,
  getAllCrmRecords,
};


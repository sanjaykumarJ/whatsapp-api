// Simple in-memory CRM storage.
// Replace this with your actual CRM API integration (HubSpot, Salesforce, custom DB, etc.).

const leads = [];

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
function saveMessageToCrm(payload) {
  const record = {
    id: leads.length + 1,
    from: payload.from,
    name: payload.name || null,
    message: payload.message,
    timestamp: payload.timestamp,
    raw: payload.raw || null,
    createdAt: new Date().toISOString(),
  };

  leads.push(record);
  console.log("[CRM] Stored WhatsApp message in CRM store:", record);
  return record;
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


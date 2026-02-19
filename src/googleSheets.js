const { google } = require("googleapis");
require("dotenv").config();

// Load service account credentials from environment variable
// The GOOGLE_SHEETS_CREDENTIALS env variable should contain the full JSON as a string
// IMPORTANT: In production, keep this credential safe and never commit it to public repos.
let serviceAccount;

try {
  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  
  if (!credentialsJson) {
    throw new Error(
      "GOOGLE_SHEETS_CREDENTIALS environment variable is not set. " +
      "Please set it to the JSON string of your Google service account credentials."
    );
  }

  serviceAccount = JSON.parse(credentialsJson);
  
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Invalid Google Sheets credentials. Missing required fields.");
  }
} catch (error) {
  console.error("[SHEETS] Error loading credentials:", error.message);
  throw error;
}

// Google Sheets scopes
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Create an authenticated Google Sheets client using the service account.
 */
function getSheetsClient() {
  const auth = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    SCOPES
  );

  return google.sheets({ version: "v4", auth });
}

/**
 * Append a row to a Google Sheet.
 *
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {string} range - The A1 notation of a range to search for a logical table of data (e.g. "Sheet1!A1:D1").
 * @param {Array} values - Array of values for a single row, e.g. ["+918608305358", "Some message", "timestamp"].
 */
async function appendRow(spreadsheetId='1V12fmiRPKjOaXg6G_o443idhvWmv3vs5n0WLNviAo14', range, values) {
  const sheets = getSheetsClient();

  const resource = {
    values: [values],
  };

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: '1V12fmiRPKjOaXg6G_o443idhvWmv3vs5n0WLNviAo14',
    range:'Sheet1!A1:F1',
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });

  console.log("[SHEETS] AppendRow response:", response.data);
  return response.data;
}

/**
 * Read values from a Google Sheet.
 *
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {string} range - The A1 notation of the values to retrieve.
 */
async function readRange(spreadsheetId, range) {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  console.log("[SHEETS] ReadRange response:", response.data);
  return response.data;
}

module.exports = {
  getSheetsClient,
  appendRow,
  readRange,
};


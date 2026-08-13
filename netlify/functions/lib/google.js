const { JWT } = require("google-auth-library");

const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function getGoogleAuthClient(scopes) {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw publicError(500, "Missing GOOGLE_SERVICE_ACCOUNT_JSON", "Falta configurar la variable GOOGLE_SERVICE_ACCOUNT_JSON.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (parseError) {
    throw publicError(500, `Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ${parseError.message}`, "La variable GOOGLE_SERVICE_ACCOUNT_JSON no és un JSON vàlid.");
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw publicError(500, "Service account JSON missing client_email or private_key", "La variable GOOGLE_SERVICE_ACCOUNT_JSON no conté client_email o private_key.");
  }

  return new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, "\n"),
    scopes
  });
}

async function getAccessToken(authClient, serviceName) {
  const { token } = await authClient.getAccessToken();
  if (!token) {
    throw publicError(500, `Could not obtain Google access token for ${serviceName}`, `No s'ha pogut autenticar amb Google ${serviceName}.`);
  }
  return token;
}

function publicError(statusCode, message, publicMessage) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

module.exports = { CALENDAR_READONLY_SCOPE, SPREADSHEETS_SCOPE, getGoogleAuthClient, getAccessToken, publicError };

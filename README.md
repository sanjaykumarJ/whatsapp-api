## WhatsApp Webhook API

This project exposes a WhatsApp Cloud API webhook to receive incoming messages and store them into a simple CRM layer.

### Local setup

- **Install dependencies**

```bash
npm install
```

- **Environment variables**

Create a `.env` file (you can copy from `.env.example`):

```env
PORT=3000
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v18.0
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Note for GOOGLE_SHEETS_CREDENTIALS**: This should be the entire JSON content from your `sheets-api-487808-c77092506b84.json` file as a single-line string. You can convert it using:
```bash
# On Mac/Linux:
cat sheets-api-487808-c77092506b84.json | jq -c

# Or manually copy the entire JSON and put it in quotes in your .env file
```

- **Run locally**

```bash
npm run dev
# or
npm run start
```

### Deploying to Railway

- **1. Create a new Railway project**
  - Go to `https://railway.app/`, create an account, and click **New Project**.
  - Choose **Deploy from GitHub** (or **Deploy from Repo**) and select the repository that contains this code.

- **2. Railway build & start**
  - Railway will detect this as a Node.js project and install dependencies from `package.json`.
  - It will run the `start` script:

```bash
npm run start
```

- **3. Configure environment variables on Railway**
  - In your Railway project, go to the **Variables** tab.
  - Add:
    - `WHATSAPP_VERIFY_TOKEN` = the same token you will set in the Meta (Facebook) WhatsApp webhook configuration.
    - `WHATSAPP_ACCESS_TOKEN` = your WhatsApp Business API access token
    - `WHATSAPP_PHONE_NUMBER_ID` = your WhatsApp Business phone number ID
    - `WHATSAPP_API_VERSION` = `v18.0` (or your preferred API version)
    - `GOOGLE_SHEETS_CREDENTIALS` = the entire JSON content from your service account file as a single-line string (copy the entire JSON and paste it as the value)
  - You do **not** need to set `PORT`; Railway sets it automatically, and the app already uses `process.env.PORT`.

- **4. Expose the webhook URL to Meta**
  - After the deployment is successful, Railway will give you a public URL like `https://your-service.up.railway.app`.
  - In the Meta Developers dashboard (WhatsApp configuration), set:
    - **Webhook URL**: `https://your-service.up.railway.app/webhook`
    - **Verify Token**: the same `WHATSAPP_VERIFY_TOKEN` you configured on Railway.
  - Click **Verify and Save**; Meta will call `GET /webhook` for verification.

- **5. Confirm messages are stored**
  - When someone sends a WhatsApp message to your configured number, Meta will `POST` to `/webhook`.
  - The service will parse the message and store it in the in-memory CRM store defined in `src/crm.js`.
  - For debugging, you can create a temporary route or use the existing `GET /crm/records` endpoint to inspect stored data.


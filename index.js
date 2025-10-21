//import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log }) => {
  try {
    // Log the raw JSON body sent by EMIS
    log("🔔 Payment callback received:");
    log(JSON.stringify(req.body, null, 2));

    // Optionally extract details
    const { reference, status, amount } = req.body || {};

    if (status === "SUCCESS") {
      log(`✅ Payment successful for reference: ${reference}`);
    } else {
      log(`❌ Payment failed for reference: ${reference}`);
    }

    // You can also save this to your Appwrite database:
    /*
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    await databases.createDocument(
      "yourDatabaseId",
      "yourCollectionId",
      reference || "unknown",
      req.body
    );
    */

    // Return a 200 response to EMIS
    return res.json({
      success: true,
      message: "Callback received successfully",
    });
  } catch (error) {
    log("❌ Error processing callback: " + error.message);
    return res.json({ success: false, error: error.message }, 500);
  }
};

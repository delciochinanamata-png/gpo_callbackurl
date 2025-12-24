const { Client, Databases } = require("node-appwrite");

module.exports = async function ({ req, res, log }) {
  log("✅ Payment callback received:");
  log(JSON.stringify(req.body, null, 2));

  try {
    const { amount, status, reference, merchantReferenceNumber, currency } =
      req.body || {};

    // Extract the actual reference ID from the nested object
    const paymentReference = reference?.id || merchantReferenceNumber;

    if (status === "ACCEPTED") {
      log(`💰 Payment successful for reference: ${paymentReference}`);

      // Initialize Appwrite client
      const client = new Client()
        .setEndpoint("https://cloud.appwrite.io/v1") // Your Appwrite endpoint
        .setProject("67a682940035cad1b98b") // Your project ID
        .setKey(process.env.APPWRITE_API_KEY); // Your API key from environment variables

      const database = new Databases(client);

      // Save to Appwrite database
      const result = await database.createDocument(
        "67a684a9002817a69692", // databaseId
        "confirmedpayment", // collectionId
        "unique()", // documentId (auto-generated)
        {
          amountPaid: amount,
          paymentMethod: "GPO_Iframe", // or extract from request if available
          paymentReference: paymentReference,
        }
      );

      log(`✅ Payment saved to database with ID: ${result.$id}`);
    } else {
      log(`❌ Payment status not accepted: ${status}`);
    }

    // Always respond with 200 OK
    return res.json({ success: true, message: "Callback processed" });
  } catch (error) {
    log(`❌ Error processing payment callback: ${error.message}`);
    return res.json({ success: false, error: error.message }, 500);
  }
};

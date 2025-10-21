module.exports = async function ({ req, res, log }) {
  log("✅ Payment callback received:");
  log(JSON.stringify(req.body, null, 2));

  // Example of extracting values
  const { reference, status, amount } = req.body || {};

  if (status === "SUCCESS") {
    log(`💰 Payment successful for reference: ${reference}`);
  } else {
    log(`❌ Payment failed for reference: ${reference}`);
  }

  // Always respond with 200 OK
  return res.json({ success: true });
};

const { Client, Databases, Query, ID } = require("node-appwrite");
const axios = require("axios"); // Changed to require for consistency

module.exports = async function ({ req, res, log, error }) {
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
        .setEndpoint("https://cloud.appwrite.io/v1")
        .setProject("67a682940035cad1b98b")
        .setKey(process.env.APPWRITE_API_KEY);

      const database = new Databases(client);

      // Helper function to send emails
      async function sendEmail(to, sub, cont) {
        try {
          const response = await axios.get(
            "https://68e0f1710002cb71f220.fra.appwrite.run",
            {
              params: {
                toUserId: to,
                subject: sub,
                content: cont,
              },
            }
          );

          log("Response status:", response.status);
          log("Response data:", JSON.stringify(response.data, null, 2));
        } catch (err) {
          log("Failed to send email:");
          if (err.response) {
            log("Status:", err.response.status);
            log("Data:", JSON.stringify(err.response.data, null, 2));
          } else {
            log("Error:", err.message);
          }
        }
      }

      // Helper function to get date from now
      function getDateFromNow(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toISOString();
      }

      // Helper function to remove items from cart
      async function removeItemFromCart(status) {
        // Implement this function based on your needs
        log(`Items would be marked as: ${status}`);
        // Example implementation:
        // await database.updateDocument(...)
      }

      // Main purchase registration function
      async function registerPurchase(givenUserId, givenCartId) {
        try {
          // DEBUG: Check what we're working with
          log(
            `DEBUG - givenCartId: ${givenCartId}, type: ${typeof givenCartId}`
          );
          log(`DEBUG - givenCartId as number: ${Number(givenCartId)}`);
          log(`DEBUG - givenCartId as string: "${String(givenCartId)}"`);

          // Convert cartId to NUMBER for queries (your schema expects integer)
          const cartIdNumber = Number(givenCartId);

          // Step 1: Find documents that match the condition
          const result = await database.listDocuments(
            "67a684a9002817a69692", // database ID
            "681fb5ae001d3beb714e", // collection ID (cart items)
            [Query.equal("userId", givenUserId)]
          );

          log("user id:" + givenUserId);
          log("user cart:" + givenCartId);
          log(`Found ${result.documents.length} items in cart`);

          // Step 2: Process each item
          for (const doc of result.documents) {
            // Check if this item has already been purchased
            const existingPurchase = await database.listDocuments(
              "67a684a9002817a69692",
              "67a90671000df73d91d6", // purchase collection
              [
                Query.equal("userId", givenUserId),
                Query.equal("itemDescriptionId", doc.itemDescriptionId),
                Query.equal("cartId", cartIdNumber), // Use NUMBER
              ]
            );

            // Only create purchase if it doesn't already exist
            if (existingPurchase.documents.length === 0) {
              const total = doc.affiliateId
                ? doc.itemQuantity * doc.itemPrice -
                  doc.itemQuantity * doc.itemPrice * 0.1
                : doc.itemQuantity * doc.itemPrice;

              // Send appropriate email based on product type
              if (doc.isOwnerLink) {
                const subject = `Nova Venda de ${(
                  total -
                  total * 0.07
                ).toLocaleString("pt-BR")} KZ! 🚀`;
                const content = `💰 Nova Venda Confirmada!\n\nParabéns! 🎉\nAcabou de realizar uma nova venda através da Buuca.com.\n\nProduto: ${doc.itemTitle}\n\nContinue assim! Pode ver todos os detalhes da sua venda e acompanhar o seu desempenho no seu Painel do Vendedor da Buuca.\n\nObrigado por vender connosco!\nEquipe Buuca.com`;
                await sendEmail(doc.creatorUserId, subject, content);
              } else if (doc.ItemType === "livro") {
                const subject = `Nova Venda de ${(
                  total -
                  total * 0.07
                ).toLocaleString("pt-BR")} KZ! 🚀`;
                const content = `💰 Nova Venda Confirmada!\n\nParabéns! 🎉\nAcabou de realizar uma nova venda através da Buuca.com.\n\nProduto: ${doc.itemTitle}\n\nContinue assim! Pode ver todos os detalhes da sua venda e acompanhar o seu desempenho no seu Painel do Vendedor da Buuca.\n\nObrigado por vender connosco!\nEquipe Buuca.com`;
                await sendEmail(doc.creatorUserId, subject, content);
              } else if (doc.affiliateId) {
                const subject = `Nova Venda de ${(
                  total -
                  total * 0.5
                ).toLocaleString("pt-BR")} KZ! 🚀`;
                const content = `💰 Nova Venda Confirmada!\n\nParabéns! 🎉\nAcabou de realizar uma nova venda através da Buuca.com.\n\nProduto: ${doc.itemTitle}\n\nContinue assim! Pode ver todos os detalhes da sua venda e acompanhar o seu desempenho no seu Painel do Vendedor da Buuca.\n\nObrigado por vender connosco!\nEquipe Buuca.com`;
                await sendEmail(doc.creatorUserId, subject, content);

                // Affiliate email
                const subjectAfiliate = `Nova Comissão de ${(
                  total -
                  total * 0.7
                ).toLocaleString("pt-BR")} KZ! 🚀`;
                const contentAffiliate = `💰 Nova Comissão Confirmada!\n\nParabéns! 🎉\nAcabou de ganhar uma comissão pela venda de um produto através da Buuca.com.\n\nProduto: ${doc.itemTitle}\n\nContinue a promover produtos e acompanhe os seus ganhos no seu Painel de Afiliado da Buuca.\n\nObrigado por fazer parte da nossa comunidade!\nEquipe Buuca.com`;
                await sendEmail(
                  doc.affiliateId,
                  subjectAfiliate,
                  contentAffiliate
                );
              } else {
                const subject = `Nova Venda de ${(
                  total -
                  total * 0.4
                ).toLocaleString("pt-BR")} KZ! 🚀`;
                const content = `💰 Nova Venda Confirmada!\n\nParabéns! 🎉\nAcabou de realizar uma nova venda através da Buuca.com.\n\nProduto: ${doc.itemTitle}\n\nContinue assim! Pode ver todos os detalhes da sua venda e acompanhar o seu desempenho no seu Painel do Vendedor da Buuca.\n\nObrigado por vender connosco!\nEquipe Buuca.com`;
                await sendEmail(doc.creatorUserId, subject, content);
              }

              // Create purchase document - use NUMBER for cartId
              await database.createDocument(
                "67a684a9002817a69692",
                "67a90671000df73d91d6",
                ID.unique(),
                {
                  userId: givenUserId,
                  itemDescriptionId: doc.itemDescriptionId,
                  quantity: doc.itemQuantity,
                  totalPaid: doc.affiliateId
                    ? doc.itemQuantity * doc.itemPrice -
                      doc.itemQuantity * doc.itemPrice * 0.1
                    : doc.itemQuantity * doc.itemPrice,
                  cartId: cartIdNumber, // Store as NUMBER
                  creatorUserId: doc.creatorUserId,
                  affiliateId: doc.affiliateId,
                  deliveryState:
                    doc.ItemType === "treinamento" ||
                    doc.ItemType === "curso" ||
                    doc.ItemType === "e-book"
                      ? "entregue"
                      : doc.ItemType === "subscrição"
                      ? "buuca.com"
                      : "pendente",
                  deliveryDate:
                    doc.ItemType === "subscrição"
                      ? getDateFromNow(doc.itemQuantity)
                      : null,
                  buucaInterest: doc.isOwnerLink
                    ? 7
                    : doc.ItemType === "livro"
                    ? 7
                    : doc.affiliateId
                    ? 50
                    : 40,
                }
              );

              // Update item quantity and sales count
              const itemsDescript = await database.listDocuments(
                "67a684a9002817a69692",
                "67a684ce0026d008def8", // items collection
                [Query.equal("$id", doc.itemDescriptionId)]
              );

              if (itemsDescript.documents.length > 0) {
                const item = itemsDescript.documents[0];
                const updateData = {
                  sales: (item.sales || 0) + doc.itemQuantity,
                };

                if (
                  item.availiableQuantity !== null &&
                  item.availiableQuantity !== undefined
                ) {
                  updateData.availiableQuantity =
                    item.availiableQuantity - doc.itemQuantity;
                }

                await database.updateDocument(
                  "67a684a9002817a69692",
                  "67a684ce0026d008def8",
                  doc.itemDescriptionId,
                  updateData
                );
              }
            } else {
              log(`Purchase already exists for item: ${doc.itemDescriptionId}`);
            }
          }

          // Mark cart items as paid
          await removeItemFromCart("itemPaid");
        } catch (err) {
          log(`Error in registerPurchase: ${err.message}`);

          // Add more detailed error information
          if (err.message.includes("cartId")) {
            log("ERROR DETAILS - cartId query issue:");
            log(`  givenCartId value: ${givenCartId}`);
            log(`  givenCartId type: ${typeof givenCartId}`);
            log(`  converted to number: ${Number(givenCartId)}`);

            // Try to get a sample from the purchase collection to see the schema
            try {
              const sample = await database.listDocuments(
                "67a684a9002817a69692",
                "67a90671000df73d91d6",
                [Query.limit(1)]
              );
              if (sample.documents.length > 0) {
                log(`Sample purchase cartId: ${sample.documents[0].cartId}`);
                log(
                  `Sample purchase cartId type: ${typeof sample.documents[0]
                    .cartId}`
                );
              }
            } catch (sampleErr) {
              log(`Could not get sample: ${sampleErr.message}`);
            }
          }

          throw err;
        }
      }

      // Check what fields exist in your confirmedpayment collection
      // Remove or adjust fields that don't exist in the schema
      const paymentData = {
        amountPaid: amount,
        paymentMethod: "GPO_Iframe",
        paymentReference: paymentReference,
      };

      // Only add currency if it exists in your collection schema
      // If not, you need to add it to your collection first or remove this line
      // paymentData.currency = currency;

      // Save payment to database
      const paymentResult = await database.createDocument(
        "67a684a9002817a69692",
        "confirmedpayment", // collectionId
        ID.unique(),
        paymentData
      );

      log(`✅ Payment saved to database with ID: ${paymentResult.$id}`);

      // Find the generated payment reference
      const existingPurchaseRef = await database.listDocuments(
        "67a684a9002817a69692",
        "generatedpaymentreference",
        [
          Query.equal("paymentReference", paymentReference),
          Query.equal("status", "pending"),
        ]
      );

      log(
        `Found ${existingPurchaseRef.documents.length} pending payment references`
      );

      // Process each pending payment reference
      if (existingPurchaseRef.documents.length > 0) {
        for (const doc of existingPurchaseRef.documents) {
          await registerPurchase(doc.userId, doc.cartId);

          await database.updateDocument(
            "67a684a9002817a69692",
            "generatedpaymentreference",
            doc.$id,
            {
              status: "confirmed",
            }
          );

          log(`✅ Updated payment reference ${doc.$id} to confirmed`);
        }
      } else {
        log(`⚠️ No pending payment references found for: ${paymentReference}`);
      }
    } else {
      log(`❌ Payment status not accepted: ${status}`);
    }

    // Always respond with 200 OK
    return res.json({ success: true, message: "Callback processed" });
  } catch (err) {
    log(`❌ Error processing payment callback: ${err.message}`);
    log(err.stack || "No stack trace available");

    // In Appwrite Functions, use res.json() with status code in the response
    return res.json(
      {
        success: false,
        error: err.message,
        statusCode: 500,
      },
      500
    ); // The second parameter sets the HTTP status
  }
};

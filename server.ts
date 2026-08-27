import express from "express";
import path from "path";
import crypto from "crypto";
import opennode from "opennode";
import axios from "axios";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  const getOpenNodeConfig = () => {
    const apiKey = process.env.OPENNODE_API_KEY;
    if (!apiKey) throw new Error("OPENNODE_API_KEY is not configured");
    opennode.setCredentials(apiKey, "live");
    return apiKey;
  };

  // Generic Webhook route
  app.post("/api/webhooks/opennode", (req, res) => {
    try {
      const apiKey = getOpenNodeConfig();
      const received = req.body.hashed_order;
      const calculated = crypto
        .createHmac("sha256", apiKey)
        .update(req.body.id)
        .digest("hex");

      if (received !== calculated) {
        return res.status(403).send("Invalid signature");
      }

      console.log("Webhook verified:", req.body);

      // Handle underpaid case by initiating refund
      if (req.body.status === "underpaid") {
        console.log("Processing underpaid order, initiating refund...");
        // Logic to initiate refund would go here
      }

      res.status(200).send("Verified");
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook processing error");
    }
  });

  // API to initiate withdrawal
  app.post("/api/opennode/withdraw", async (req, res) => {
    try {
      getOpenNodeConfig();
      const { amount, address } = req.body;
      const withdrawal = {
        type: "ln",
        amount,
        address,
        callback_url: `${process.env.APP_URL}/api/webhooks/opennode`,
      };
      const result = await opennode.initiateWithdrawalAsync(withdrawal);
      res.json(result);
    } catch (error: any) {
      console.error(`${error.status} | ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // API to initiate refund
  app.post("/api/opennode/refund", async (req, res) => {
    try {
      const apiKey = getOpenNodeConfig();
      const { checkout_id, address, email } = req.body;
      
      const response = await axios.post("https://api.opennode.co/v1/refunds", {
        checkout_id,
        address,
        email
      }, {
        headers: { "Authorization": apiKey, "Content-Type": "application/json" }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Refund error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API to initiate batch withdrawal
  app.post("/api/opennode/withdraw/batch", async (req, res) => {
    try {
      const apiKey = getOpenNodeConfig();
      
      const response = await axios.post("https://api.opennode.co/v2/withdrawals/chain/batch", req.body, {
        headers: { "Authorization": apiKey, "Content-Type": "application/json" }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Batch withdrawal error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PinataSDK } = require("pinata");
const { paymentMiddleware } = require("x402-express");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT });

const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS;
const UPLOAD_PRICE = "$0.01";
const PIN_JSON_PRICE = "$0.001";
const BASE_CHAIN_ID = 8453;

// --- Free endpoints ---

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    agent: "ipfs.x-402.eth",
    uptime: process.uptime(),
  });
});

app.get("/pricing", (_req, res) => {
  res.json({
    agent: "ipfs.x-402.eth",
    network: "Base mainnet",
    currency: "USDC",
    endpoints: {
      "/upload": { method: "POST", price: UPLOAD_PRICE, description: "Upload a file to IPFS via Pinata" },
      "/pin-json": { method: "POST", price: PIN_JSON_PRICE, description: "Pin a JSON object to IPFS via Pinata" },
    },
  });
});

// --- Paid endpoints ---

app.post(
  "/upload",
  paymentMiddleware(PAYMENT_ADDRESS, UPLOAD_PRICE, { chainId: BASE_CHAIN_ID }),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const file = new File([blob], req.file.originalname, { type: req.file.mimetype });
      const result = await pinata.upload.file(file);

      res.json({
        success: true,
        cid: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        gateway: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "IPFS upload failed" });
    }
  }
);

app.post(
  "/pin-json",
  paymentMiddleware(PAYMENT_ADDRESS, PIN_JSON_PRICE, { chainId: BASE_CHAIN_ID }),
  async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No JSON body provided" });
      }

      const result = await pinata.upload.json(req.body);

      res.json({
        success: true,
        cid: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        gateway: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      });
    } catch (err) {
      console.error("Pin JSON error:", err);
      res.status(500).json({ error: "IPFS JSON pinning failed" });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`x402 IPFS Agent listening on port ${PORT}`);
});

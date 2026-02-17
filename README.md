# x402 IPFS Agent

Agent-native IPFS storage as a paid machine-to-machine service. Upload files and pin JSON to IPFS via [Pinata](https://pinata.cloud), gated by [x402](https://www.x402.org/) micropayments in USDC on Base mainnet.

Registered as an [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agent at **ipfs.x-402.eth**.

- Docs (ENS/IPFS): https://x-402.eth.link
- Agent card: https://8004scan.io/agent/base/17093

## Endpoints

| Method | Path        | Price    | Description                     |
|--------|-------------|----------|---------------------------------|
| GET    | `/health`   | Free     | Agent status and uptime         |
| GET    | `/pricing`  | Free     | Per-request pricing info        |
| POST   | `/upload`   | $0.01    | Upload a file to IPFS           |
| POST   | `/pin-json` | $0.001   | Pin a JSON object to IPFS       |

## Payment Flow

```
Client                          Agent
  │                               │
  ├── POST /upload ──────────────►│
  │                               │
  │◄── 402 Payment Required ──────┤  (includes X-PAYMENT header details)
  │                               │
  ├── Pay USDC on Base ──────────►│  (on-chain tx)
  │                               │
  ├── POST /upload ──────────────►│  (with X-PAYMENT proof)
  │    + payment proof            │
  │                               ├── Upload to Pinata
  │◄── 200 { cid, gateway } ─────┤
  │                               │
```

## Architecture

- **Express** — HTTP server
- **x402-express** — Payment middleware enforcing USDC micropayments on Base
- **Pinata API JWT** — IPFS file upload and JSON pinning
- **multer** — Multipart file handling for `/upload`

## Setup Hosted

Production API is hosted on Replit: https://x-402.replit.app

Docs are hosted via ENS/IPFS: https://x-402.eth.link

ERC-8004 Agent: https://8004scan.io/agent/base/17093

This repo contains docs + ERC-8004 metadata (no backend source yet)

Network: Base mainnet

Asset: USDC

Pricing endpoint: /pricing

### Environment Variables

| Variable          | Description                        |
|-------------------|------------------------------------|
| `PINATA_JWT`      | Pinata API JWT token               |
| `PAYMENT_ADDRESS` | Your USDC receiving wallet address |
| `PORT`            | Server port (default: 3000)        |

## API Reference

### GET /health

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "agent": "ipfs.x-402.eth",
  "uptime": 42.5
}
```

### GET /pricing

```bash
curl http://localhost:3000/pricing
```

```json
{
  "agent": "ipfs.x-402.eth",
  "network": "Base mainnet",
  "currency": "USDC",
  "endpoints": {
    "/upload": { "method": "POST", "price": "$0.01", "description": "Upload a file to IPFS via Pinata" },
    "/pin-json": { "method": "POST", "price": "$0.001", "description": "Pin a JSON object to IPFS via Pinata" }
  }
}
```

### POST /upload

Multipart file upload. Requires x402 payment proof.

```bash
curl -X POST http://localhost:3000/upload \
  -H "X-PAYMENT: <payment-proof>" \
  -F "file=@document.pdf"
```

```json
{
  "success": true,
  "cid": "QmXx...abc",
  "size": 12345,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmXx...abc"
}
```

### POST /pin-json

Pin a JSON object. Requires x402 payment proof.

```bash
curl -X POST http://localhost:3000/pin-json \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: <payment-proof>" \
  -d '{"name": "asset", "value": 100}'
```

```json
{
  "success": true,
  "cid": "QmYy...def",
  "size": 64,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmYy...def"
}
```

## Author

Hector Morel

## License

MIT

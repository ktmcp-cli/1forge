# 1Forge CLI - AI Agent Guide

This CLI provides programmatic access to the 1Forge Finance/Forex API.

## Quick Start for AI Agents

```bash
1forge config set --api-key YOUR_KEY
1forge symbols list
1forge quotes get EUR/USD
```

## Available Commands

### config
- `1forge config set --api-key <key>` - Set API key
- `1forge config get <key>` - Get config value
- `1forge config list` - Show all config

### quotes
- `1forge quotes get <pair>` - Get real-time quote (e.g. EUR/USD)
- `1forge quotes list [--pairs EUR/USD,GBP/USD]` - List multiple quotes
- `1forge quotes convert --from EUR --to USD --amount 1000` - Convert currency

### history
- `1forge history get <pair> [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--interval daily|hourly]` - Get historical data
- `1forge history candles <pair> [--interval hourly|minutely]` - Get OHLC candlestick data

### symbols
- `1forge symbols list` - List all currency pairs
- `1forge symbols search <query>` - Search pairs (e.g. EUR, USD)
- `1forge symbols market-status` - Check if forex market is open

## Tips for Agents

- All commands support `--json` for machine-readable output
- Pipe to `jq` for filtering: `1forge quotes list --json | jq '.[] | {pair: .s, price: .p}'`
- Currency pairs use slash notation: EUR/USD, GBP/JPY, etc.
- Use `--json` when processing output programmatically

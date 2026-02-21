> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# 1Forge CLI

Production-ready CLI for the [1Forge](https://1forge.com) Finance/Forex API. Get real-time forex quotes, historical data, and currency conversions directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by 1Forge.

## Installation

```bash
npm install -g @ktmcp-cli/1forge
```

## Configuration

```bash
1forge config set --api-key YOUR_API_KEY
```

Get your API key at [1forge.com](https://1forge.com).

## Usage

### Configuration

```bash
# Set API key
1forge config set --api-key YOUR_API_KEY

# Show configuration
1forge config list

# Get a specific config value
1forge config get apiKey
```

### Quotes

```bash
# Get a real-time quote for a currency pair
1forge quotes get EUR/USD

# List multiple quotes
1forge quotes list
1forge quotes list --pairs EUR/USD,GBP/USD,USD/JPY,AUD/USD

# Convert currency
1forge quotes convert --from EUR --to USD --amount 1000
1forge quotes convert --from GBP --to JPY --amount 500
```

### History

```bash
# Get historical data for a pair
1forge history get EUR/USD
1forge history get EUR/USD --from 2024-01-01 --to 2024-12-31
1forge history get EUR/USD --interval daily

# Get OHLC candlestick data
1forge history candles EUR/USD
1forge history candles EUR/USD --interval hourly --from 2024-01-01
```

### Symbols

```bash
# List all available currency pairs
1forge symbols list

# Search for pairs containing a currency code
1forge symbols search EUR
1forge symbols search USD

# Check forex market status
1forge symbols market-status
```

### JSON Output

All commands support `--json` for machine-readable output:

```bash
# Get quote as JSON
1forge quotes get EUR/USD --json

# Pipe to jq
1forge quotes list --json | jq '.[] | {pair: .s, price: .p}'

# List all symbols as JSON
1forge symbols list --json | jq 'length'
```

## Examples

```bash
# Check current EUR/USD rate
1forge quotes get EUR/USD

# Convert 10,000 USD to EUR
1forge quotes convert --from USD --to EUR --amount 10000

# See if markets are open
1forge symbols market-status

# Get weekly candles for GBP/USD
1forge history candles GBP/USD --interval daily --from 2024-01-01 --to 2024-01-31 --json
```

## License

MIT

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.

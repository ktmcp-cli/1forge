import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured, getAllConfig } from './config.js';
import {
  getQuote,
  listQuotes,
  convertCurrency,
  getHistory,
  getCandles,
  listSymbols,
  searchSymbols,
  getMarketStatus
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }
  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });
  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('1Forge API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  1forge config set apiKey YOUR_API_KEY'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('1forge')
  .description(chalk.bold('1Forge CLI') + ' - Forex & finance data from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', '1Forge API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    } else {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('get')
  .description('Get a configuration value')
  .argument('<key>', 'Config key to retrieve')
  .action((key) => {
    const value = getConfig(key);
    if (value === undefined || value === null || value === '') {
      console.log(chalk.yellow(`${key}: not set`));
    } else {
      const masked = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
        ? '*'.repeat(Math.min(String(value).length, 8))
        : value;
      console.log(`${key}: ${chalk.green(masked)}`);
    }
  });

configCmd
  .command('list')
  .description('List all configuration values')
  .action(() => {
    const all = getAllConfig();
    console.log(chalk.bold('\n1Forge CLI Configuration\n'));
    const apiKey = all.apiKey;
    console.log('API Key:', apiKey ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// QUOTES
// ============================================================

const quotesCmd = program.command('quotes').description('Get forex quotes');

quotesCmd
  .command('get <pair>')
  .description('Get a real-time quote for a currency pair (e.g. EUR/USD)')
  .option('--json', 'Output as JSON')
  .action(async (pair, options) => {
    requireAuth();
    try {
      const quote = await withSpinner(`Fetching quote for ${pair}...`, () => getQuote(pair));
      if (options.json) { printJson(quote); return; }
      if (!quote) { printError('No quote found for that pair'); process.exit(1); }
      console.log(chalk.bold(`\n${pair} Quote\n`));
      console.log('Symbol:  ', chalk.cyan(quote.s || pair));
      console.log('Bid:     ', chalk.green(quote.b ?? 'N/A'));
      console.log('Ask:     ', chalk.red(quote.a ?? 'N/A'));
      console.log('Price:   ', chalk.bold(quote.p ?? quote.price ?? 'N/A'));
      if (quote.t) console.log('Time:    ', new Date(quote.t * 1000).toLocaleString());
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

quotesCmd
  .command('list')
  .description('List real-time quotes for multiple currency pairs')
  .option('--pairs <pairs>', 'Comma-separated pairs (e.g. EUR/USD,GBP/USD,USD/JPY)', 'EUR/USD,GBP/USD,USD/JPY,USD/CHF,AUD/USD')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const pairs = options.pairs.split(',').map(p => p.trim());
      const quotes = await withSpinner('Fetching quotes...', () => listQuotes(pairs));
      if (options.json) { printJson(quotes); return; }
      const list = Array.isArray(quotes) ? quotes : [quotes];
      printTable(list, [
        { key: 's', label: 'Pair' },
        { key: 'b', label: 'Bid' },
        { key: 'a', label: 'Ask' },
        { key: 'p', label: 'Price' },
        { key: 't', label: 'Timestamp', format: (v) => v ? new Date(v * 1000).toLocaleTimeString() : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

quotesCmd
  .command('convert')
  .description('Convert an amount from one currency to another')
  .requiredOption('--from <currency>', 'Source currency (e.g. EUR)')
  .requiredOption('--to <currency>', 'Target currency (e.g. USD)')
  .requiredOption('--amount <number>', 'Amount to convert')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner(
        `Converting ${options.amount} ${options.from} to ${options.to}...`,
        () => convertCurrency({ from: options.from, to: options.to, quantity: options.amount })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nCurrency Conversion\n'));
      console.log('From:    ', `${options.amount} ${options.from}`);
      console.log('To:      ', chalk.green(`${result.value ?? result.result ?? 'N/A'} ${options.to}`));
      console.log('Rate:    ', result.rate ?? 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// HISTORY
// ============================================================

const historyCmd = program.command('history').description('Get historical forex data');

historyCmd
  .command('get <pair>')
  .description('Get historical price data for a currency pair')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--interval <interval>', 'Data interval (daily|hourly|minutely)', 'daily')
  .option('--json', 'Output as JSON')
  .action(async (pair, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching historical data...', () =>
        getHistory({ pair, from: options.from, to: options.to, interval: options.interval })
      );
      if (options.json) { printJson(data); return; }
      const list = Array.isArray(data) ? data : (data?.candles || data?.data || []);
      if (list.length === 0) {
        console.log(chalk.yellow('No historical data found for the specified range.'));
        return;
      }
      console.log(chalk.bold(`\nHistorical Data for ${pair}\n`));
      printTable(list.slice(0, 20), [
        { key: 'time', label: 'Date/Time', format: (v) => v ? new Date(v * 1000).toLocaleDateString() : 'N/A' },
        { key: 'o', label: 'Open' },
        { key: 'h', label: 'High' },
        { key: 'l', label: 'Low' },
        { key: 'c', label: 'Close' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

historyCmd
  .command('candles <pair>')
  .description('Get OHLC candlestick data for a currency pair')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--interval <interval>', 'Candle interval (hourly|minutely)', 'hourly')
  .option('--json', 'Output as JSON')
  .action(async (pair, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching candle data...', () =>
        getCandles({ pair, from: options.from, to: options.to, interval: options.interval })
      );
      if (options.json) { printJson(data); return; }
      const list = Array.isArray(data) ? data : (data?.candles || data?.data || []);
      if (list.length === 0) {
        console.log(chalk.yellow('No candle data found.'));
        return;
      }
      console.log(chalk.bold(`\nCandlestick Data for ${pair}\n`));
      printTable(list.slice(0, 20), [
        { key: 'time', label: 'Time', format: (v) => v ? new Date(v * 1000).toLocaleString() : 'N/A' },
        { key: 'o', label: 'Open' },
        { key: 'h', label: 'High' },
        { key: 'l', label: 'Low' },
        { key: 'c', label: 'Close' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SYMBOLS
// ============================================================

const symbolsCmd = program.command('symbols').description('Explore available currency pairs');

symbolsCmd
  .command('list')
  .description('List all available currency pairs')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const symbols = await withSpinner('Fetching symbols...', () => listSymbols());
      if (options.json) { printJson(symbols); return; }
      const list = Array.isArray(symbols) ? symbols : [];
      console.log(chalk.bold(`\nAvailable Currency Pairs (${list.length} total)\n`));
      const rows = list.map(s => ({ symbol: s }));
      printTable(rows, [{ key: 'symbol', label: 'Currency Pair' }]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

symbolsCmd
  .command('search <query>')
  .description('Search currency pairs by keyword (e.g. EUR, USD, GBP)')
  .option('--json', 'Output as JSON')
  .action(async (query, options) => {
    requireAuth();
    try {
      const results = await withSpinner(`Searching for "${query}"...`, () => searchSymbols(query));
      if (options.json) { printJson(results); return; }
      if (!results || results.length === 0) {
        console.log(chalk.yellow('No matching symbols found.'));
        return;
      }
      console.log(chalk.bold(`\nSearch Results for "${query}"\n`));
      const rows = results.map(s => ({ symbol: s }));
      printTable(rows, [{ key: 'symbol', label: 'Currency Pair' }]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

symbolsCmd
  .command('market-status')
  .description('Check if the forex market is currently open')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const status = await withSpinner('Checking market status...', () => getMarketStatus());
      if (options.json) { printJson(status); return; }
      console.log(chalk.bold('\nForex Market Status\n'));
      const isOpen = status?.market_is_open ?? status?.isOpen ?? false;
      console.log('Status:', isOpen ? chalk.green('OPEN') : chalk.red('CLOSED'));
      if (status?.message) console.log('Message:', status.message);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}

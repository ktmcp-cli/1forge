import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.1forge.com';

function getApiKey() {
  const apiKey = getConfig('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured. Run: 1forge config set apiKey YOUR_API_KEY');
  }
  return apiKey;
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401 || status === 403) {
      throw new Error('Authentication failed. Check your API key: 1forge config set apiKey YOUR_KEY');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else {
      const message = data?.error || data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from 1Forge API. Check your internet connection.');
  } else {
    throw error;
  }
}

async function apiGet(path, params = {}) {
  const apiKey = getApiKey();
  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      params: { api_key: apiKey, ...params }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// QUOTES
// ============================================================

export async function getQuote(pair) {
  const data = await apiGet('/quotes', { pairs: pair });
  return Array.isArray(data) ? data[0] : data;
}

export async function listQuotes(pairs) {
  const pairsStr = Array.isArray(pairs) ? pairs.join(',') : pairs;
  return await apiGet('/quotes', { pairs: pairsStr });
}

export async function convertCurrency({ from, to, quantity }) {
  return await apiGet('/convert', { from, to, quantity });
}

// ============================================================
// HISTORY
// ============================================================

export async function getHistory({ pair, from, to, interval = 'daily' }) {
  return await apiGet('/candles', { pairs: pair, from, to, interval });
}

export async function getCandles({ pair, from, to, interval = 'hourly' }) {
  return await apiGet('/candles', { pairs: pair, from, to, interval });
}

// ============================================================
// SYMBOLS
// ============================================================

export async function listSymbols() {
  return await apiGet('/symbols');
}

export async function searchSymbols(query) {
  const symbols = await listSymbols();
  const q = query.toLowerCase();
  return symbols.filter(s => s.toLowerCase().includes(q));
}

export async function getMarketStatus() {
  return await apiGet('/market_status');
}

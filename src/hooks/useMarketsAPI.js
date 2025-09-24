import { API_BASE_URL } from '../config/api';

export async function fetchMarkets() {
  const response = await fetch(`${API_BASE_URL}/api/markets`);
  if (!response.ok) throw new Error('Failed to fetch trading pairs');
  return await response.json();
}
/**
 * Calculate the response time in days between two dates
 */
export function calculateResponseTime(
  requestDate: Date | null, 
  receivedDate: Date | null
): number | null {
  if (!requestDate || !receivedDate) {
    return null;
  }

  const timeDifference = receivedDate.getTime() - requestDate.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
  return daysDifference >= 0 ? daysDifference : null;
}

/**
 * Format response time for display
 */
export function formatResponseTime(days: number | null): string {
  if (days === null || days === undefined) {
    return 'N/A';
  }
  
  if (days === 0) {
    return 'Same day';
  } else if (days === 1) {
    return '1 day';
  } else {
    return `${days} days`;
  }
}

/**
 * Get response time status color based on days
 */
export function getResponseTimeStatus(days: number | null): {
  color: string;
  status: string;
} {
  if (days === null || days === undefined) {
    return { color: 'text-gray-500', status: 'Unknown' };
  }
  
  if (days <= 1) {
    return { color: 'text-green-600', status: 'Excellent' };
  } else if (days <= 3) {
    return { color: 'text-blue-600', status: 'Good' };
  } else if (days <= 7) {
    return { color: 'text-yellow-600', status: 'Average' };
  } else {
    return { color: 'text-red-600', status: 'Slow' };
  }
}

/**
 * Format number with comma separators for display
 */
export function formatNumberWithCommas(value: number | string): string {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '';
  }
  
  return num.toLocaleString();
}

/**
 * Remove commas from formatted number string to get raw value
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  
  // Remove commas and parse
  const cleanValue = value.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency with comma separators
 */
export function formatCurrency(amount: number | string, currency: string = 'JOD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return `0 ${currency}`;
  }
  
  return `${num.toLocaleString()} ${currency}`;
}

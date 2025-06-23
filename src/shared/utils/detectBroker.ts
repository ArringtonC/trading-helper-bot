export enum BrokerType {
  IBKR = 'IBKR',
  Schwab = 'Schwab',
  Unknown = 'Unknown',
}

// More specific and less common headers are weighted higher or are prerequisites.
const IBKR_CHARACTERISTIC_HEADERS: { header: string; weight: number; required?: boolean }[] = [
  { header: 'Asset Category', weight: 2, required: true },
  { header: 'IBCommission', weight: 2 },
  { header: 'TradePrice', weight: 1 },
  { header: 'Symbol', weight: 1, required: true },
  { header: 'Currency', weight: 1, required: true },
  { header: 'TradeDate', weight: 1 },
  { header: 'Quantity', weight: 1 },
  { header: 'DataDiscriminator', weight: 1 }, // Often in 'Trades' or 'Orders' sections
  { header: 'Open/CloseIndicator', weight: 1 },
  { header: 'IBOrderID', weight: 1},
];

const SCHWAB_CHARACTERISTIC_HEADERS: { header: string; weight: number; required?: boolean }[] = [
  { header: 'Date acquired', weight: 2 },
  { header: 'Date sold', weight: 2 },
  { header: 'Total proceeds', weight: 2, required: true },
  { header: 'Total cost basis', weight: 2, required: true },
  { header: 'Quantity', weight: 1 }, // Can overlap, so lower weight or check in context
  { header: 'Symbol', weight: 1 },
  { header: 'Description', weight: 1 }, // Schwab often has detailed descriptions
  { header: 'Wash sale loss disallowed', weight: 1},
  { header: 'Net gain or loss', weight: 1},
];

const MIN_REQUIRED_SCORE = 3; // Minimum score to be considered a match
const MIN_REQUIRED_HEADERS_PRESENT = 2; // Minimum number of *required* headers to be present for a potential match

export const detectBroker = (headers: string[]): BrokerType => {
  if (!headers || headers.length === 0) {
    return BrokerType.Unknown;
  }

  const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());

  let ibkrScore = 0;
  let ibkrRequiredHeadersFound = 0;
  for (const charHeader of IBKR_CHARACTERISTIC_HEADERS) {
    if (lowerCaseHeaders.includes(charHeader.header.toLowerCase())) {
      ibkrScore += charHeader.weight;
      if (charHeader.required) {
        ibkrRequiredHeadersFound++;
      }
    }
  }

  let schwabScore = 0;
  let schwabRequiredHeadersFound = 0;
  for (const charHeader of SCHWAB_CHARACTERISTIC_HEADERS) {
    if (lowerCaseHeaders.includes(charHeader.header.toLowerCase())) {
      schwabScore += charHeader.weight;
      if (charHeader.required) {
        schwabRequiredHeadersFound++;
      }
    }
  }

  const isPotentiallyIBKR = ibkrScore >= MIN_REQUIRED_SCORE && ibkrRequiredHeadersFound >= MIN_REQUIRED_HEADERS_PRESENT;
  const isPotentiallySchwab = schwabScore >= MIN_REQUIRED_SCORE && schwabRequiredHeadersFound >= MIN_REQUIRED_HEADERS_PRESENT;

  if (isPotentiallyIBKR && isPotentiallySchwab) {
    // If both match, prefer the one with the higher score
    // This is a simple tie-breaker, more sophisticated logic could be added
    return ibkrScore > schwabScore ? BrokerType.IBKR : BrokerType.Schwab;
  }
  if (isPotentiallyIBKR) {
    return BrokerType.IBKR;
  }
  if (isPotentiallySchwab) {
    return BrokerType.Schwab;
  }

  return BrokerType.Unknown;
}; 
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  hammer:
    "A single candle with a small body near the top and a long lower shadow. Often appears after a decline when sellers were rejected — a potential bullish reversal if confirmed.",
  doji:
    "Open and close are nearly equal, forming a cross. Signals indecision; the next move depends on context and follow-through.",
  bullish_engulfing:
    "A large green candle whose body fully covers the prior red candle's body. Buyers overpowered sellers — a potential bullish reversal.",
  bearish_engulfing:
    "A large red candle whose body fully covers the prior green candle's body. Sellers overpowered buyers — a potential bearish reversal.",
  morning_star:
    "Three-candle bullish reversal: down candle, small indecision candle, then a strong up candle. Often marks a shift from decline to recovery.",
  evening_star:
    "Three-candle bearish reversal: up candle, small indecision candle, then a strong down candle. Often marks a shift from advance to weakness.",
  shooting_star:
    "Small body near the bottom with a long upper shadow after an advance. Buying was rejected at higher prices — a potential bearish reversal.",
  three_white_soldiers:
    "Three consecutive strong green candles with higher closes. Suggests sustained bullish momentum and buyer control.",
  three_black_crows:
    "Three consecutive strong red candles with lower closes. Suggests sustained bearish momentum and seller control.",
};

export function patternCandlestickDescription(
  patternId: string | null | undefined,
): string | null {
  if (!patternId) return null;
  return PATTERN_DESCRIPTIONS[patternId] ?? null;
}

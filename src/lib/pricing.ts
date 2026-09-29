/** Free searches per visitor per day (UTC). Asking the same question again is free. */
export const FREE_DAILY_SEARCHES = 10;
/**
 * Free comparisons and questions about a pasted text, together, per visitor per
 * day (UTC). They cost up to 10x a search, so they have their own, smaller limit.
 */
export const FREE_DAILY_EXTRAS = 3;
/** Quairy Pro, per month, in euros. */
export const PRO_MONTHLY_EUR = 4;
export const PRO_PRICE_LABEL = `€${PRO_MONTHLY_EUR}/month`;
/** Searches a subscriber's history keeps. */
export const HISTORY_SIZE = 200;

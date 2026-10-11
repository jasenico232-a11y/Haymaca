/**
 * Structured server-side logging for payment and booking events. It only ever
 * records references and outcomes, never card data (we never receive any),
 * never signatures, never session tokens.
 */
type Fields = Record<string, string | number | boolean | null>;

export function logEvent(event: string, fields: Fields = {}): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    event,
    ...fields,
  });
  // A single JSON line per event, ready for a log drain.
  console.log(line);
}

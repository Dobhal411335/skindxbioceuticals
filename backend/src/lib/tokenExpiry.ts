/**
 * Parses JWT-style duration strings (e.g. 15m, 7d, 1h) into a Date from now.
 */
export function expiresAtFromDuration(duration: string, from = new Date()): Date {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = match[2]!.toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(from.getTime() + amount * multipliers[unit]!);
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function toJakartaDate(date: Date): Date {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);

  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      shifted.getUTCHours(),
      shifted.getUTCMinutes(),
      shifted.getUTCSeconds(),
      shifted.getUTCMilliseconds(),
    ),
  );
}

export function nowJakarta(): Date {
  return toJakartaDate(new Date());
}

export function parseJakartaDate(input: string | Date): Date {
  if (input instanceof Date) {
    return toJakartaDate(input);
  }

  const trimmed = input.trim();

  if (/Z$|[+-]\d{2}:\d{2}$/i.test(trimmed)) {
    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${input}`);
    }

    return toJakartaDate(parsed);
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/,
  );

  if (!match) {
    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${input}`);
    }

    return toJakartaDate(parsed);
  }

  const [
    ,
    year,
    month,
    day,
    hour = '0',
    minute = '0',
    second = '0',
    millisecond = '0',
  ] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millisecond.padEnd(3, '0').slice(0, 3)),
    ),
  );
}

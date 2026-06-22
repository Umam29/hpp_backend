const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatToJakartaISO(date: Date): string {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
  const seconds = String(shifted.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(shifted.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

export function serializeDatesToJakarta<T>(value: T): T {
  if (value instanceof Date) {
    return formatToJakartaISO(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeDatesToJakarta(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = serializeDatesToJakarta(nestedValue);
    }

    return result as T;
  }

  return value;
}

import { parse, stringify } from 'qs';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseNestedFormBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const flatBody: Record<string, string> = {};
  const directFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      flatBody[key] = value;
      continue;
    }

    if (Array.isArray(value) || isPlainObject(value)) {
      directFields[key] = value;
      continue;
    }

    if (value !== undefined && value !== null) {
      flatBody[key] = String(value);
    }
  }

  const parsedFlat =
    Object.keys(flatBody).length > 0
      ? (parse(stringify(flatBody), { depth: 10 }) as Record<string, unknown>)
      : {};

  return { ...parsedFlat, ...directFields };
}

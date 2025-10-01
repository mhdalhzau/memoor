/**
 * Safe Logger Utility
 * 
 * Provides utilities to safely log objects by redacting sensitive fields
 * like passwords, salts, tokens, and other PII.
 */

interface SafeLogOptions {
  redactedFields?: string[];
  allowedFields?: string[];
  redactionText?: string;
}

const DEFAULT_REDACTED_FIELDS = [
  'password',
  'salt',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
  'sessionId',
  'session_id',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber'
];

const USER_SAFE_FIELDS = ['id', 'email', 'name', 'role'];

/**
 * Redacts sensitive fields from an object
 */
function redactSensitiveFields(
  obj: any,
  redactedFields: string[] = DEFAULT_REDACTED_FIELDS,
  redactionText: string = '[REDACTED]'
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item, redactedFields, redactionText));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (redactedFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = redactionText;
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value, redactedFields, redactionText);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Filters object to only include allowed fields
 */
function filterAllowedFields(obj: any, allowedFields: string[]): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterAllowedFields(item, allowedFields));
  }

  const filtered: any = {};
  for (const field of allowedFields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }
  return filtered;
}

/**
 * Safely logs an object by redacting sensitive fields
 */
export function safeLog(label: string, obj: any, options: SafeLogOptions = {}): void {
  const {
    redactedFields = DEFAULT_REDACTED_FIELDS,
    allowedFields,
    redactionText = '[REDACTED]'
  } = options;

  let safeObj = obj;

  if (allowedFields && allowedFields.length > 0) {
    safeObj = filterAllowedFields(obj, allowedFields);
  } else {
    safeObj = redactSensitiveFields(obj, redactedFields, redactionText);
  }

  console.log(label, typeof safeObj === 'object' ? JSON.stringify(safeObj, null, 2) : safeObj);
}

/**
 * Safely logs a user object with only safe fields (id, email, name, role)
 */
export function safeLogUser(label: string, user: any): void {
  if (!user) {
    console.log(label, 'Not authenticated');
    return;
  }

  safeLog(label, user, { allowedFields: USER_SAFE_FIELDS });
}

/**
 * Creates a safe copy of an object with sensitive fields redacted
 */
export function createSafeCopy(obj: any, options: SafeLogOptions = {}): any {
  const {
    redactedFields = DEFAULT_REDACTED_FIELDS,
    allowedFields,
    redactionText = '[REDACTED]'
  } = options;

  if (allowedFields && allowedFields.length > 0) {
    return filterAllowedFields(obj, allowedFields);
  }

  return redactSensitiveFields(obj, redactedFields, redactionText);
}

/**
 * Creates a safe copy of a user object with only safe fields
 */
export function createSafeUserCopy(user: any): any {
  if (!user) {
    return null;
  }
  return filterAllowedFields(user, USER_SAFE_FIELDS);
}

import { NextRequest, NextResponse } from 'next/server';

export function createApiResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function createApiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(message: string = 'Success') {
  return NextResponse.json({ success: true, message });
}

export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function parseJsonBody(body: unknown): Record<string, unknown> {
  return typeof body === 'string' ? JSON.parse(body) : (body as Record<string, unknown>);
}

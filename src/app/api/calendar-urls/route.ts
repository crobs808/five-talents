import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/calendar-urls?organizationId=...
 * Get all calendar URLs for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return createApiError('organizationId is required');
    }

    const calendarUrls = await prisma.calendarUrl.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    return createApiResponse(calendarUrls);
  } catch (error) {
    console.error('GET /api/calendar-urls error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * POST /api/calendar-urls
 * Create a new calendar URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, name, url } = body;

    if (!organizationId || !name || !url) {
      return createApiError('organizationId, name, and url are required');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return createApiError('Invalid URL format');
    }

    const calendarUrl = await prisma.calendarUrl.create({
      data: {
        organizationId,
        name,
        url,
      },
    });

    return createApiResponse(calendarUrl, 201);
  } catch (error) {
    console.error('POST /api/calendar-urls error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/calendar-urls
 * Update a calendar URL
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, url, isActive } = body;

    if (!id) {
      return createApiError('id is required');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      // Validate URL if provided
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return createApiError('Invalid URL format');
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const calendarUrl = await prisma.calendarUrl.update({
      where: { id },
      data: updateData,
    });

    return createApiResponse(calendarUrl);
  } catch (error) {
    console.error('PATCH /api/calendar-urls error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * DELETE /api/calendar-urls?id=...
 * Delete a calendar URL
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return createApiError('id is required');
    }

    await prisma.calendarUrl.delete({
      where: { id },
    });

    return createApiResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/calendar-urls error:', error);
    return createApiError('Internal server error', 500);
  }
}

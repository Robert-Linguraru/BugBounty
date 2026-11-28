import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200),
  targetSystem: z
    .string()
    .trim()
    .min(2, 'Target system is required')
    .max(255),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  details: z
    .string()
    .trim()
    .min(10, 'Details must be at least 10 characters')
    .max(10000),
  isDisclosed: z.boolean().optional().default(false)
});

export async function createReport(req, res) {
  try {
    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid report data'
      });
    }

    const { title, targetSystem, severity, details, isDisclosed } = parsed.data;

    const report = await prisma.report.create({
      data: {
        userId: req.user.id,
        title,
        targetSystem,
        severity,
        details,
        isDisclosed
      }
    });

    return res.status(201).json({
      success: true,
      data: { report }
    });
  } catch (err) {
    console.error('Create report error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
}

export async function getReports(req, res) {
  try {
    const whereClause =
      req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

    const reports = await prisma.report.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: { reports }
    });
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
}

const updateReportSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200).optional(),
  targetSystem: z.string().trim().min(2, 'Target system is required').max(255).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  details: z.string().trim().min(10, 'Details must be at least 10 characters').max(10000).optional(),
  isDisclosed: z.boolean().optional()
});

function canAccessReport(report, user) {
  return report.userId === user.id || user.role === 'ADMIN';
}

export async function getReportById(req, res) {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this report'
      });
    }

    return res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (err) {
    console.error('Get report by ID error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
}

export async function updateReport(req, res) {
  try {
    const { id } = req.params;

    const parsed = updateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid update data'
      });
    }

    const existingReport = await prisma.report.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (!canAccessReport(existingReport, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to update this report'
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: parsed.data
    });

    return res.status(200).json({
      success: true,
      data: { report: updatedReport }
    });
  } catch (err) {
    console.error('Update report error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
}

export async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const existingReport = await prisma.report.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (!canAccessReport(existingReport, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to delete this report'
      });
    }

    await prisma.report.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Report deleted successfully', id }
    });
  } catch (err) {
    console.error('Delete report error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
}
import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Connector, type IConnectorDocument } from '../models/Connector.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { Department, type IDepartmentDocument } from '../models/Department.js';
import { CircuitBreakerService } from './circuitBreaker.service.js';
import { ApplicationStatus } from '@govconnect/shared-types';

export class MonitoringService {
  /**
   * Get executive telemetry overview for Admin Dashboard
   */
  static async getSystemOverview() {
    const [
      totalApplications,
      submittedApps,
      inReviewApps,
      approvedApps,
      rejectedApps,
      failedApps,
      totalAuditLogs,
      deptRaw,
      connRaw,
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: ApplicationStatus.SUBMITTED }),
      Application.countDocuments({ status: ApplicationStatus.IN_REVIEW }),
      Application.countDocuments({ status: ApplicationStatus.APPROVED }),
      Application.countDocuments({ status: ApplicationStatus.REJECTED }),
      Application.countDocuments({ status: ApplicationStatus.FAILED }),
      AuditEvent.countDocuments(),
      Department.find({ isActive: true }).lean(),
      Connector.find().lean(),
    ]);

    const departments = deptRaw as unknown as IDepartmentDocument[];
    const connectors = connRaw as unknown as IConnectorDocument[];

    const breakerStatuses = CircuitBreakerService.getAllStatuses();

    const connectorHealth = connectors.map((c) => {
      const memory = breakerStatuses[c.code];
      return {
        _id: c._id,
        code: c.code,
        name: c.name,
        type: c.type || 'REST',
        circuitState: memory?.state || c.circuitState || 'CLOSED',
        consecutiveFailures: memory?.consecutiveFailures || 0,
        averageLatencyMs: c.metrics?.averageLatencyMs || 120,
        totalRequests: c.metrics?.totalRequests || 0,
        successfulRequests: c.metrics?.successfulRequests || 0,
        failedRequests: c.metrics?.failedRequests || 0,
        lastSuccess: c.metrics?.lastSuccess || null,
        lastFailure: c.metrics?.lastFailure || null,
        lastErrorMessage: c.metrics?.lastErrorMessage || null,
      };
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const applicationsByDate = await Application.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.APPROVED] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.REJECTED] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendMap = new Map(applicationsByDate.map((item) => [item._id, item]));
    const applicationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const match = trendMap.get(dateKey);
      applicationTrends.push({
        date: dateKey,
        count: match ? match.count : 0,
        approved: match ? match.approved : 0,
        rejected: match ? match.rejected : 0,
      });
    }

    return {
      kpi: {
        totalApplications,
        submittedApps,
        inReviewApps,
        approvedApps,
        rejectedApps,
        failedApps,
        totalAuditLogs,
        activeDepartments: departments.length,
        systemHealth: connectorHealth.every((c) => c.circuitState === 'CLOSED') ? 'OPTIMAL' : 'DEGRADED',
      },
      connectors: connectorHealth,
      applicationTrends,
      departments: departments.map((d) => ({
        id: d._id,
        name: d.name,
        code: d.code,
        slaHours: d.slaHours || 48,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

import mongoose, { Schema, Document } from 'mongoose';
import { ConnectorStatus, CircuitBreakerState } from '@govconnect/shared-types';

export interface IConnectorMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  lastErrorMessage?: string;
}

export interface IConnectorDocument extends Document {
  name: string;
  code: string;
  type: string;
  departmentId: mongoose.Types.ObjectId;
  baseUrl: string;
  healthEndpoint: string;
  authType: 'NONE' | 'API_KEY' | 'BEARER' | 'MTLS';
  timeoutMs: number;
  maxRetries: number;
  circuitState: CircuitBreakerState;
  metrics: IConnectorMetrics;
  status: ConnectorStatus;
  isActive: boolean;
  latencyMs: number;
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const connectorSchema = new Schema<IConnectorDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'REST',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    baseUrl: {
      type: String,
      required: true,
    },
    healthEndpoint: {
      type: String,
      default: '/health',
    },
    authType: {
      type: String,
      enum: ['NONE', 'API_KEY', 'BEARER', 'MTLS'],
      default: 'NONE',
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    circuitState: {
      type: String,
      enum: Object.values(CircuitBreakerState),
      default: CircuitBreakerState.CLOSED,
    },
    metrics: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      averageLatencyMs: { type: Number, default: 0 },
      lastSuccess: { type: Date },
      lastFailure: { type: Date },
      lastErrorMessage: { type: String },
    },
    status: {
      type: String,
      enum: Object.values(ConnectorStatus),
      default: ConnectorStatus.ACTIVE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    lastChecked: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

connectorSchema.index({ status: 1 });
connectorSchema.index({ departmentId: 1 });

export const Connector = mongoose.model<IConnectorDocument>(
  'Connector',
  connectorSchema,
);

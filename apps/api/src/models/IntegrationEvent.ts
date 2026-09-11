import mongoose, { Schema, Document } from 'mongoose';

export interface IIntegrationEventDocument extends Document {
  connectorCode: string;
  endpoint: string;
  method: string;
  correlationId: string;
  requestPayload: any;
  responsePayload: any;
  statusCode?: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

const integrationEventSchema = new Schema<IIntegrationEventDocument>(
  {
    connectorCode: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    requestPayload: {
      type: Schema.Types.Mixed,
    },
    responsePayload: {
      type: Schema.Types.Mixed,
    },
    statusCode: {
      type: Number,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

integrationEventSchema.index({ timestamp: -1 });
integrationEventSchema.index({ connectorCode: 1, timestamp: -1 });

export const IntegrationEvent = mongoose.model<IIntegrationEventDocument>(
  'IntegrationEvent',
  integrationEventSchema,
);

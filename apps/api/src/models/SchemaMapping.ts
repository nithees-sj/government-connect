import mongoose, { Schema, Document } from 'mongoose';
import { IFieldMapping } from '@govconnect/shared-types';

export interface ISchemaMappingDocument extends Document {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  version: string;
  fieldMappings: IFieldMapping[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fieldMappingSchema = new Schema<IFieldMapping>(
  {
    sourceField: { type: String, required: true },
    targetField: { type: String, required: true },
    transformationType: {
      type: String,
      default: 'DIRECT',
    },
    defaultValue: { type: Schema.Types.Mixed },
    isRequired: { type: Boolean, default: false },
  },
  { _id: false },
);

const schemaMappingSchema = new Schema<ISchemaMappingDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sourceSystem: {
      type: String,
      required: true,
      index: true,
    },
    targetSystem: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: String,
      default: 'v1.0.0',
    },
    fieldMappings: [fieldMappingSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

schemaMappingSchema.index({ sourceSystem: 1, targetSystem: 1, isActive: 1 });

export const SchemaMapping = mongoose.model<ISchemaMappingDocument>(
  'SchemaMapping',
  schemaMappingSchema,
);

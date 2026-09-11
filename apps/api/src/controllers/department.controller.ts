import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department.js';
import { ApiError } from '../middleware/errorHandler.js';

export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

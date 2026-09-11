import { Request, Response, NextFunction } from 'express';
import { ConsentService } from '../services/consent.service.js';
import { Citizen } from '../models/Citizen.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function getConsents(req: Request, res: Response, next: NextFunction) {
  try {
    const citizen = await Citizen.findOne({ userId: req.user!.userId });
    if (!citizen) {
      return res.json({ success: true, data: [] });
    }

    const consents = await ConsentService.getCitizenConsents(citizen._id);
    res.json({ success: true, data: consents });
  } catch (error) {
    next(error);
  }
}

export async function grantConsent(req: Request, res: Response, next: NextFunction) {
  try {
    let citizen = await Citizen.findOne({ userId: req.user!.userId });
    if (!citizen) {
      citizen = await Citizen.create({
        userId: req.user!.userId,
        fullName: req.user!.name,
        dateOfBirth: new Date('1990-01-01'),
        contact: { email: req.user!.email, phone: '9876543210' },
        address: { street: '123 Civil Lines', city: 'New Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
      });
    }

    const { departmentId, purpose, dataFields, validDays } = req.body;

    const consent = await ConsentService.grantConsent({
      citizenId: citizen._id,
      departmentId,
      purpose,
      dataFields,
      validDays,
      actorUser: { userId: req.user?.userId, name: req.user?.name },
    });

    res.status(201).json({
      success: true,
      data: consent,
      message: 'DPDP consent granted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const citizen = await Citizen.findOne({ userId: req.user!.userId });
    if (!citizen) {
      throw new ApiError(404, 'Citizen profile not found');
    }

    const consent = await ConsentService.revokeConsent(id, citizen._id, {
      userId: req.user?.userId,
      name: req.user?.name,
    });

    res.json({
      success: true,
      data: consent,
      message: 'DPDP consent revoked successfully',
    });
  } catch (error) {
    next(error);
  }
}

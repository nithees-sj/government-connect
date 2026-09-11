import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service.js';
import { Citizen } from '../models/Citizen.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const citizen = await Citizen.findOne({ userId: req.user!.userId });
    if (!citizen) {
      return res.json({ success: true, data: [] });
    }

    const documents = await DocumentService.getCitizenDocuments(citizen._id);
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

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

    const { documentType, applicationId } = req.body;

    const docRecord = await DocumentService.processUploadedFile({
      citizenId: citizen._id,
      applicationId,
      file: req.file,
      documentType,
      actorUser: { userId: req.user?.userId, name: req.user?.name },
    });

    res.status(201).json({
      success: true,
      data: docRecord,
      message: 'Document uploaded and verified with SHA-256 integrity check.',
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    let citizenId: string | undefined;

    if (req.user?.role === 'CITIZEN') {
      const citizen = await Citizen.findOne({ userId: req.user.userId });
      citizenId = citizen?._id.toString();
    }

    const doc = await DocumentService.getDocumentForDownload(id, citizenId);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', doc.mimeType);
    res.sendFile(doc.storagePath);
  } catch (error) {
    next(error);
  }
}

export async function getWallet(req: Request, res: Response, next: NextFunction) {
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

    const documents = await DocumentService.getCitizenDocuments(citizen._id);

    const hasAadhaarDoc = documents.some((d) => d.metadata?.documentType === 'SOVEREIGN_IDENTITY' || d.metadata?.documentType === 'AADHAAR');
    const hasPanDoc = documents.some((d) => d.metadata?.documentType === 'TAX_CLEARANCE' || d.metadata?.documentType === 'PAN');

    res.json({
      success: true,
      data: {
        citizenId: citizen._id,
        fullName: citizen.fullName,
        aadhaarNumber: citizen.aadhaarNumber || '',
        panNumber: citizen.panNumber || '',
        dateOfBirth: citizen.dateOfBirth,
        phone: citizen.contact?.phone || '',
        email: citizen.contact?.email || req.user!.email,
        isIdentityVerified: Boolean(citizen.aadhaarNumber || hasAadhaarDoc),
        isTaxVerified: Boolean(citizen.panNumber || hasPanDoc),
        hasAadhaarDoc,
        hasPanDoc,
        totalDocuments: documents.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const { aadhaarNumber, panNumber, phone, dateOfBirth } = req.body;

    let citizen = await Citizen.findOne({ userId: req.user!.userId });
    if (!citizen) {
      citizen = await Citizen.create({
        userId: req.user!.userId,
        fullName: req.user!.name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : undefined,
        panNumber: panNumber ? String(panNumber).trim().toUpperCase() : undefined,
        contact: { email: req.user!.email, phone: phone || '9876543210' },
        address: { street: '123 Civil Lines', city: 'New Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
      });
    } else {
      if (aadhaarNumber !== undefined) {
        citizen.aadhaarNumber = aadhaarNumber ? String(aadhaarNumber).trim() : undefined;
      }
      if (panNumber !== undefined) {
        citizen.panNumber = panNumber ? String(panNumber).trim().toUpperCase() : undefined;
      }
      if (phone) {
        citizen.contact.phone = String(phone).trim();
      }
      if (dateOfBirth) {
        citizen.dateOfBirth = new Date(dateOfBirth);
      }
      await citizen.save();
    }

    res.json({
      success: true,
      message: 'Citizen Sovereign Wallet credentials updated successfully.',
      data: {
        citizenId: citizen._id,
        fullName: citizen.fullName,
        aadhaarNumber: citizen.aadhaarNumber || '',
        panNumber: citizen.panNumber || '',
        dateOfBirth: citizen.dateOfBirth,
        phone: citizen.contact?.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

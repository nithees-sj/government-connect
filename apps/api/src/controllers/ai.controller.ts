import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service.js';

export async function suggestMapping(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceFields, targetFields, sourceSystem, targetSystem } = req.body;
    const suggestions = AIService.suggestSchemaMapping({
      sourceFields,
      targetFields,
      sourceSystem,
      targetSystem,
    });
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
}

export async function detectDuplicates(req: Request, res: Response, next: NextFunction) {
  try {
    const { formData } = req.body;
    const candidates = await AIService.detectDuplicates(formData);
    res.json({ success: true, data: candidates });
  } catch (error) {
    next(error);
  }
}

export async function smartRouting(req: Request, res: Response, next: NextFunction) {
  try {
    const recommendation = AIService.recommendRouting(req.body);
    res.json({ success: true, data: recommendation });
  } catch (error) {
    next(error);
  }
}

export async function queryMonitoring(req: Request, res: Response, next: NextFunction) {
  try {
    const { query } = req.body;
    const answer = await AIService.queryMonitoringAssistant(query);
    res.json({ success: true, data: answer });
  } catch (error) {
    next(error);
  }
}

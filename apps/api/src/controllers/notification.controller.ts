import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const result = await NotificationService.getUserNotifications(req.user!.userId, unreadOnly);
    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await NotificationService.markAsRead(id, req.user!.userId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await NotificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true, message: `${count} notifications marked as read` });
  } catch (error) {
    next(error);
  }
}

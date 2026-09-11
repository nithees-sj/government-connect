import mongoose from 'mongoose';
import { Notification, type INotificationDocument } from '../models/Notification.js';
import { NotificationType } from '@govconnect/shared-types';
import { logger } from '../utils/logger.js';

export class NotificationService {
  /**
   * Create an in-app notification and simulate multichannel dispatch (SMS/Email)
   */
  static async sendNotification(params: {
    recipientId: string | mongoose.Types.ObjectId;
    type?: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<INotificationDocument> {
    const notification = await Notification.create({
      recipientId: params.recipientId,
      type: params.type || NotificationType.INFO,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
    });

    // Multi-channel dispatch simulation
    logger.info(
      `🔔 [Dispatch:MultiChannel] Notification delivered to User [${params.recipientId}]: "${params.title}" - ${params.message}`,
    );

    return notification;
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const filter: mongoose.FilterQuery<INotificationDocument> = {
      recipientId: new mongoose.Types.ObjectId(userId),
    };
    if (unreadOnly) {
      filter.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({
        recipientId: new mongoose.Types.ObjectId(userId),
        read: false,
      }),
    ]);

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipientId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { read: true } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(userId),
        read: false,
      },
      { $set: { read: true } },
    );
    return result.modifiedCount;
  }
}

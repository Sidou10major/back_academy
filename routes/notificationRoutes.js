import express from 'express';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/user/:userId', getUserNotifications);
router.get('/user/:userId/count', getNotificationCount);
router.patch('/:id/read', markAsRead);
router.patch('/user/:userId/read-all', markAllAsRead);

export default router;

import express from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

router.route('/')
    .post(createAnnouncement)
    .get(getAnnouncements);

router.route('/:id')
    .get(getAnnouncementById)
    .put(updateAnnouncement)
    .delete(deleteAnnouncement);

export default router;

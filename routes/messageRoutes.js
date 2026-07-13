import express from 'express';
import {
    sendMessage,
    getConversation,
    getContacts
} from '../controllers/messageController.js';

const router = express.Router();

router.route('/')
    .post(sendMessage);

router.get('/contacts', getContacts);
router.get('/conversation/:otherUserId', getConversation);

export default router;

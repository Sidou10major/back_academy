import express from 'express';
import { createSession, getSessions, updateSession, deleteSession } from '../controllers/classSessionController.js';

const router = express.Router();

router.route('/')
    .post(createSession)
    .get(getSessions);

router.route('/:id')
    .put(updateSession)
    .delete(deleteSession);

export default router;
import express from 'express';
import {
    createMaterial,
    getSessionMaterials,
    deleteMaterial
} from '../controllers/materialController.js';

const router = express.Router();

router.post('/', createMaterial);
router.get('/session/:sessionId', getSessionMaterials);
router.delete('/:id', deleteMaterial);

export default router;

import express from 'express';
import {
    createMaterial,
    getSessionMaterials,
    getAllMaterials,
    deleteMaterial
} from '../controllers/materialController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .post(upload.single('file'), createMaterial)
    .get(getAllMaterials);

router.get('/session/:sessionId', getSessionMaterials);
router.delete('/:id', deleteMaterial);

export default router;

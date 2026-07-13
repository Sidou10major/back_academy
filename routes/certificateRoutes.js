import express from 'express';
import {
    issueCertificate,
    getStudentCertificates,
    getAllCertificates,
    getCertificateById,
    revokeCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

router.route('/')
    .post(issueCertificate)
    .get(getAllCertificates);

router.get('/student/:studentId', getStudentCertificates);
router.route('/:id')
    .get(getCertificateById)
    .delete(revokeCertificate);

export default router;

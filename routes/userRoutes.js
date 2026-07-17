import express from 'express';
import { createUser, getUsers, loginUser, updateUser, deleteUser, unblockUser, blockUser } from '../controllers/userController.js';

const router = express.Router();

router.route('/')
    .post(createUser)
    .get(getUsers);

router.post('/login', loginUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

router.put('/:id/unblock', unblockUser);
router.put('/:id/block', blockUser);

export default router;
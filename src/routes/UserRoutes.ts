import express from 'express';
import * as userController from '../controllers/UserController';

const router = express.Router();

router.post('/user', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/user/:id', userController.getUserById);
router.delete('/user/:id', userController.deleteUserById);
router.put('/user/:id', userController.updateUser);
router.get('/users/birthday-today', userController.getUsersWithBirthdayToday);



export default router;
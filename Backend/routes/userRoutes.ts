import express from 'express';
import { getUserCredits, getAllProjects, getUserProjectById, toggleProjectPublic } from '../controllers/userController.js';
import {protect} from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.get('/projects', protect, getAllProjects);
userRouter.get('/projects/:projectId', protect ,getUserProjectById);
userRouter.post('/projects/:projectId',protect , toggleProjectPublic);

export default userRouter;
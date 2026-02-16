import express from 'express';
import { createProject, createVideo, deleteProject, getAllPublishedProjects,getProjectById,editGeneration, editVideo } from '../controllers/projectController.js';
import {protect} from '../middlewares/auth.js';
import upload from '../configs/multer.js';

const projectRouter = express.Router();

projectRouter.post('/create', protect,upload.array('images', 2),createProject);
projectRouter.post('/video', protect, createVideo);
projectRouter.get('/published', getAllPublishedProjects);
projectRouter.delete('/:projectId', protect, deleteProject);
projectRouter.get('/:projectId', protect, getProjectById);
projectRouter.post("/:projectId/edit", protect, editGeneration);
projectRouter.post("/edit-video", protect, editVideo);



export default projectRouter;
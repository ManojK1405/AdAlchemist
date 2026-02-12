import * as Sentry from "@sentry/node";
import { Request,Response } from "express";
import { prisma } from "../configs/prisma.js";


//Get user credits
export const getUserCredits = async (req: Request, res: Response    ) => {
    try {
        const {userId} = req.auth();
        if(!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        res.json({credits: user?.credits});
    } catch (error: any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get all projects
export const getAllProjects = async (req: Request, res: Response    ) => {
    try {
        const {userId} = req.auth();
        const projects = await prisma.project.findMany({
            where: {userId},
            orderBy: {createdAt: 'desc'},
        });

        res.json({projects});

    } catch (error: any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get project by id
export const getUserProjectById = async (req: Request, res: Response    ) => {
    try {
        const {userId} = req.auth();
        const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
        const project = await prisma.project.findUnique({
            where: {id: projectId, userId},
        });

        if(!project) {
            return res.status(404).json({message: 'Project not found'});
        }
        res.json({project});
    } catch (error: any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

//publish/unpublish project
export const toggleProjectPublic = async (req: Request, res: Response ) => {
    try {
        const {userId} = req.auth();
        const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
        const project = await prisma.project.findUnique({
            where: {id: projectId, userId},
        });

        if(!project) {
            return res.status(404).json({message: 'Project not found'});
        }

        if(!project?.generatedImage && !project?.generatedVideo) {
            return res.status(400).json({message: 'Project not generated'});
        }

        await prisma.project.update({
            where: {id: projectId},
            data: {
                isPublished: !project.isPublished,
            },
        });

        res.json({
            message: 'Project updated',
            isPublished: !project.isPublished
        });
    } catch (error: any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};
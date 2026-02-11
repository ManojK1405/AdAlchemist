import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import ai from "../configs/ai.js";

const loadImage = (filePath: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
};

// Create project
export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string | null = null;
  let isCreditDeducted = false;

  try {
    const { userId } = (req as any).auth();
    const {
      name = "New Project",
      aspectRatio,
      userPrompt,
      productName,
      productDescription,
      targetLength = 5,
    } = req.body;

    const images: any[] = req.files as any[];

    if (!images || images.length < 2 || !productName) {
      return res.status(400).json({
        message:
          "At least 2 images are required and product name is mandatory",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 5) {
      return res
        .status(400)
        .json({ message: "User not found or insufficient credits" });
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 5 },
      },
    });

    isCreditDeducted = true;

    // Upload original images
    const uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
          folder: "adalchemist",
        });
        return result.secure_url;
      })
    );

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        aspectRatio,
        userPrompt,
        productName,
        productDescription,
        targetLength: parseInt(targetLength),
        userId,
        uploadedImages,
        isGenerating: true,
      },
    });

    tempProjectId = project.id;

    // Gemini config
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    const img1 = loadImage(images[0].path, images[0].mimetype);
    const img2 = loadImage(images[1].path, images[1].mimetype);

    const prompt = {
      text: `
      Combine the person and product into a realistic photo.
      Make the person naturally hold or use the product.
      Make proper lighting, shadows, scale and perspective.
      Output ecommerce-quality realistic imagery.
      ${userPrompt ? `Additional instruction: ${userPrompt}` : ""}
      `,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [img1, img2, prompt],
      config: generationConfig,
    });

    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("No content generated");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData?.data) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
        break; // stop after first image
      }
    }

    if (!finalBuffer) {
      throw new Error("Failed to generate image");
    }

    // Upload generated image
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${finalBuffer.toString("base64")}`,
      {
        resource_type: "image",
        folder: "adalchemist/generated",
      }
    );

    await prisma.project.update({
      where: { id: tempProjectId },
      data: {
        generatedImage: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    return res.json({ projectId: project.id });

  } catch (error: any) {

    if (tempProjectId) {
      await prisma.project.update({
        where: { id: tempProjectId },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }

    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: (req as any).auth()?.userId },
        data: {
          credits: { increment: 5 },
        },
      });
    }

    Sentry.captureException(error);
    console.error(error);

    return res.status(500).json({ message: "Internal server error" });
  }
};


//create video
export const createVideo = async (req: Request, res: Response    ) => {
    const {userId} = req.auth();
        const { projectId } = req.body;

        let isCreditDeducted = false;
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if(!user || user.credits < 10){
            return res.status(400).json({ message: 'User not found or insufficient credits' });
        }

        //deduct credits for video generation i.e 10 credits
        await prisma.user.update({
            where: { id: userId },
            data: {
              credits: { decrement: 10 },
            },
          }).then(() => {
            isCreditDeducted = true;
          });
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId ,userId},
            include: {
            user: true,
          },
        });

        if(!project || project.isGenerating){
            return res.status(404).json({ message: 'Project not found or is generating' });
        }

        if(project.generatedVideo){
            return res.status(400).json({ message: 'Video already generated' });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
              isGenerating: true,
            },
          });

          const prompt = `make the person showcase the product which is ${project.productName}. Product Description: ${project.productDescription || "No description available"}`;

          const model = 'veo-3.1-generate-preview';

          if(!project.generatedImage){
            throw new Error('Generated image not found');
          }

          

    } catch (error:any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//get all published projects
export const getAllPublishedProjects = async (req: Request, res: Response    ) => {
    try {
        
    } catch (error:any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//delete project
export const deleteProject = async (req: Request, res: Response    ) => {
    try {
        
    } catch (error:any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}


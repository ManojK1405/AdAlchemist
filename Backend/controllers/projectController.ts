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
import axios from "axios";
import path from "path";

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

    if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Found" });
    }

    if (user.credits < 10) {
      return res
        .status(400)
        .json({ message: "Insufficient Credits" });
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 10 },
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

    const promptImage = `
You are a professional commercial photographer creating a premium advertisement image.

CORE OBJECTIVE:
Create a photorealistic advertisement showing a person naturally interacting with the product in a way that feels authentic and aspirational.

PRODUCT INTEGRITY (CRITICAL):
- Product is the hero - main focal point of composition
- Preserve exact product appearance: shape, colors, logos, text, design details
- No warping, stretching, or distortion of any kind
- Maintain accurate product scale relative to person and environment
- Product must be in sharp focus with visible details

HUMAN SUBJECT:
- Natural, confident body language appropriate for the product
- Realistic skin tones and textures across all ethnicities
- Anatomically correct hands with proper finger positioning
- Genuine facial expression matching the product/brand mood
- Professional styling - hair, makeup, wardrobe coordinated with brand aesthetic

COMPOSITION & FRAMING:
- Rule of thirds or centered hero composition
- Person positioned to complement, not compete with product
- Negative space used strategically for text overlay areas
- Eye line and gesture directing attention to product
- Environmental context relevant to product use case

LIGHTING & TECHNICAL QUALITY:
- Studio-quality three-point lighting or natural window light simulation
- Consistent light temperature (warm/cool matching brand identity)
- Realistic shadows with proper direction and softness
- Subtle highlights on product surfaces for dimension
- Catchlights in subject's eyes for life and engagement

VISUAL STYLE:
- Shot on professional camera: Canon 5D Mark IV or Sony A7R IV
- 85mm f/1.8 lens for flattering compression and natural bokeh
- Shallow depth of field (f/2.8-f/4) with product and face in focus
- Color grading: ${userPrompt?.includes('color') ? 'per user specification' : 'clean, modern, slightly elevated saturation'}
- Professional retouching: subtle, maintaining authenticity

ENVIRONMENT:
- Clean, minimal background that doesn't distract
- Context appropriate to product category and use
- Props only if they enhance storytelling
- Consistent art direction matching brand tier (luxury/mainstream/lifestyle)

FORBIDDEN ELEMENTS:
- No AI artifacts, melted features, or uncanny valley effects
- No unrealistic proportions or physics-defying poses
- No floating objects or disconnected elements
- No excessive blur, grain, or technical flaws
- No generic stock photo clichés

BRAND ALIGNMENT:
Tone: Premium, aspirational, trustworthy, modern
Mood: ${userPrompt?.includes('mood') || userPrompt?.includes('vibe') ? 'per user specification' : 'Confident, authentic, approachable'}
Target: High-end consumer expecting quality and authenticity

${userPrompt ? `\nCUSTOM REQUIREMENTS:\n${userPrompt}` : ''}

OUTPUT:
Single high-resolution advertisement image ready for commercial use.
Quality: Magazine-cover standard, suitable for billboards and premium digital placements.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [img1, img2, promptImage],
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
          credits: { increment: 10 },
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

        if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Found" });
    }

    if (user.credits < 40) {
      return res
        .status(400)
        .json({ message: "Insufficient Credits" });
    }

        //deduct credits for video generation i.e 40 credits
        await prisma.user.update({
            where: { id: userId },
            data: {
              credits: { decrement: 40 },
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

        const prompt = `
        Create a professional commercial video.

        The person must naturally showcase and interact with the product: ${project.productName}.

        Product details: ${project.productDescription || "No description provided"}.

        STRICT REQUIREMENTS:
        • Product must stay clearly visible at all times
        • Product must remain unchanged and realistic
        • Natural hand movement and interaction
        • Realistic physics and motion
        • Correct proportions and scale
        • No distortion or morphing
        • No unrealistic motion
        • No glitches or artifacts

        CINEMATIC STYLE:
        • Smooth camera movement
        • Professional commercial framing
        • Shallow depth of field
        • Natural lighting
        • Soft shadows
        • Realistic reflections

        SHOT TYPE:
        Choose the most suitable shot automatically:
        close-up / medium shot / product focus shot / lifestyle shot

        MOOD:
        Premium, modern, aspirational advertisement

        QUALITY:
        Ultra realistic
        Brand campaign level
        High detail
        Professional video production

        Output must look like a real advertisement filmed with a professional camera.
        `;


        const model = 'veo-3.1-generate-preview';

        if(!project.generatedImage){
            throw new Error('Generated image not found');
        }

        const image = await axios.get(project.generatedImage, { responseType: 'arraybuffer' })

        const imageBytes:any = Buffer.from(image.data);

        let operation:any = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBytes.toString('base64'),
                mimeType: 'image/png',
            },
            config:{
                aspectRatio:project?.aspectRatio || '9:16',
                numberOfVideos:1,
                resolution:'720p'
            }

        });

        while(!operation.done){
            await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds before checking again
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        const fileName = `${userId}_${Date.now()}.mp4`;

        const filePath = path.join('videos', fileName);

        //create image directory if not exists
        fs.mkdirSync('videos', { recursive: true });

        if(!operation.response.generatedVideos){
            throw new Error('Video generation failed');
        }

        //Download the video
        await ai.files.download({
            file:operation.response.generatedVideos[0].video,
            downloadPath: filePath,
        });

        //Upload to cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: "adalchemist/generated",
        });

        //Update project with generated video url
        await prisma.project.update({
            where: { id: project.id },
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false,
            },
        });

        //delete the local video file
        fs.unlinkSync(filePath);

        return res.json({ message: 'Video generated successfully', videoUrl: uploadResult.secure_url });

    } catch (error:any) {

      await prisma.project.update({
        where: { id: projectId,userId },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });

    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: (req as any).auth()?.userId },
        data: {
          credits: { increment: 40 },
        },
      });
    }

        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//get all published projects
export const getAllPublishedProjects = async (req: Request, res: Response    ) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                isPublished: true,
            }
        });
        
        res.json({ projects });
        
    } catch (error:any) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projectId = req.params.projectId as string;
 
    // Use findFirst instead of findUnique
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return res.json({ message: "Project deleted successfully" });

  } catch (error: any) {
    Sentry.captureException(error);
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req as any).auth?.userId as string;


    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Edit & Regenerate Image (5 credits only)
export const editGeneration = async (req: Request, res: Response) => {
  let isCreditDeducted = false;
  let project: any = null;

  try {
    const { userId } = (req as any).auth();
    const projectId = req.params.projectId as string;


    const {
      aspectRatio,
      userPrompt,
      productName,
      productDescription,
      name,
    } = req.body;

    // ✅ Check user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Found" });
    }

    if (user.credits < 5) {
      return res
        .status(400)
        .json({ message: "Insufficient Credits" });
    }

    // ✅ Get project safely
    project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.isGenerating) {
      return res.status(400).json({ message: "Project is already generating" });
    }

    // ✅ Deduct 5 credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 5 },
      },
    });

    isCreditDeducted = true;

    // ✅ Mark project as generating
    await prisma.project.update({
      where: { id: projectId },
      data: {
        isGenerating: true,
      },
    });

    // ✅ Gemini config
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || project.aspectRatio || "9:16",
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

    // ✅ Reuse previously uploaded images
    const image1Response = await axios.get(project.uploadedImages[0], {
      responseType: "arraybuffer",
    });

    const image2Response = await axios.get(project.uploadedImages[1], {
      responseType: "arraybuffer",
    });

    const img1 = {
      inlineData: {
        data: Buffer.from(image1Response.data).toString("base64"),
        mimeType: "image/png",
      },
    };

    const img2 = {
      inlineData: {
        data: Buffer.from(image2Response.data).toString("base64"),
        mimeType: "image/png",
      },
    };

    // ✅ Final prompt
    const finalPrompt = `
You are a world-class commercial photographer creating a high-end advertisement image.

IMPORTANT:
This is a revised version of a previously generated advertisement.
Apply the new creative direction clearly and noticeably.
Do NOT recreate the previous composition.
Introduce visible variation while maintaining realism.

PRODUCT DETAILS (DO NOT ALTER DESIGN):
Product Name: ${productName || project.productName}
Product Description: ${productDescription || project.productDescription}

STRICT PRODUCT RULES:
• Preserve exact product shape, color, logo, and proportions
• No warping, stretching, melting, or redesign
• Keep branding perfectly readable
• Maintain realistic scale relative to subject and environment

UPDATED CREATIVE DIRECTION:
${userPrompt || project.userPrompt || "Create a clean, premium commercial look."}

COMPOSITION REQUIREMENTS:
• Professional commercial layout
• Product must be the hero focal point
• Natural human interaction if applicable
• Realistic hand anatomy and body proportions
• Balanced negative space for advertising text

LIGHTING & TECHNICAL QUALITY:
• Studio-level lighting or realistic natural lighting
• Physically accurate shadows and reflections
• Sharp product focus
• Subtle depth of field (85mm commercial lens look)
• High dynamic range
• Ultra realistic textures

FORBIDDEN:
• No AI artifacts
• No surreal distortions
• No broken hands or extra fingers
• No floating objects
• No unnatural skin textures

ASPECT RATIO:
${aspectRatio || project.aspectRatio || "9:16"}

OUTPUT:
One ultra-high-resolution photorealistic advertisement image suitable for premium marketing campaigns.
`;



    // ✅ Generate image
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [img1, img2, finalPrompt],
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
        break;
      }
    }

    if (!finalBuffer) {
      throw new Error("Failed to generate image");
    }

    // ✅ Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${finalBuffer.toString("base64")}`,
      {
        resource_type: "image",
        folder: "adalchemist/generated",
      }
    );

    // ✅ Update project with new values
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name ?? project.name,
        aspectRatio: aspectRatio ?? project.aspectRatio,
        userPrompt: userPrompt ?? project.userPrompt,
        productName: productName ?? project.productName,
        productDescription:
          productDescription ?? project.productDescription,
        generatedImage: uploadResult.secure_url,
        isGenerating: false,
        error: "",
      },
    });

    return res.json({
      message: "Image regenerated successfully",
      imageUrl: uploadResult.secure_url,
    });

  } catch (error: any) {

    // ✅ Refund credits if deducted
    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: (req as any).auth()?.userId },
        data: {
          credits: { increment: 5 },
        },
      });
    }

    // ✅ Safely reset project generating state
    if (project) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }

    Sentry.captureException(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const editVideo = async (req: Request, res: Response) => {
  const { userId } = (req as any).auth();
  const { projectId, userPrompt } = req.body;

  let isCreditDeducted = false;

  try {
    // ✅ Check user credits (20)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Found" });
    }

    if (user.credits < 20) {
      return res
        .status(400)
        .json({ message: "Insufficient Credits" });
    }

    // ✅ Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.generatedImage) {
      return res
        .status(400)
        .json({ message: "Image must exist before editing video" });
    }

    if (project.isGenerating) {
      return res
        .status(400)
        .json({ message: "Project is already generating" });
    }

    // ✅ Deduct 20 credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 20 },
      },
    });

    isCreditDeducted = true;

    // ✅ Mark project as generating
    await prisma.project.update({
      where: { id: projectId },
      data: {
        isGenerating: true,
      },
    });

    // 🔥 Build enhanced motion prompt
    const prompt = `
      You are refining and improving an existing premium commercial advertisement video.

      IMPORTANT:
      This is a revised version of a previously generated advertisement.
      Maintain the same product identity, environment, and overall brand tone,
      but clearly apply the updated motion direction.
      Do NOT create a completely different concept.
      Enhance and evolve the existing scene.

      BASE PRODUCT (DO NOT ALTER DESIGN):
      Product Name: ${project.productName}
      Product Description: ${project.productDescription}

      PRESERVE:
      • Product appearance, logo, color, proportions
      • Overall setting and context
      • Realistic lighting consistency
      • Brand identity and premium feel

      UPDATED MOTION DIRECTION:
      ${userPrompt || project.userPrompt || "Refine motion with smoother cinematic movement."}

      MOTION REFINEMENT RULES:
      • Improve camera movement dynamics
      • Enhance natural hand and body motion
      • Add subtle cinematic depth and realism
      • Maintain physical accuracy
      • No distortion or morphing
      • No surreal effects
      • No visual glitches

      CINEMATIC ENHANCEMENT:
      • More fluid motion transitions
      • Refined depth of field
      • Natural light consistency
      • Professional advertisement pacing

      OUTPUT:
      A refined, improved version of the original commercial video with noticeable motion enhancement while preserving brand integrity.
      `;


    const model = "veo-3.1-generate-preview";

    // ✅ Download base image
    const imageResponse = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });

    const imageBytes: any = Buffer.from(imageResponse.data);

    // ✅ Start video generation
    let operation: any = await ai.models.generateVideos({
      model,
      prompt,
      image: {
        imageBytes: imageBytes.toString("base64"),
        mimeType: "image/png",
      },
      config: {
        aspectRatio: project.aspectRatio || "9:16",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    // ✅ Poll until done
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    if (!operation.response.generatedVideos) {
      throw new Error("Video regeneration failed");
    }

    // ✅ Save temp video
    const fileName = `${userId}_${Date.now()}_edit.mp4`;
    const filePath = path.join("videos", fileName);

    fs.mkdirSync("videos", { recursive: true });

    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: filePath,
    });

    // ✅ Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: "adalchemist/generated",
    });

    // ✅ Update project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false,
        userPrompt: userPrompt ?? project.userPrompt,
        error: "",
      },
    });

    // Delete local file
    fs.unlinkSync(filePath);

    return res.json({
      message: "Video regenerated successfully",
      videoUrl: uploadResult.secure_url,
    });

  } catch (error: any) {

    // Refund credits if failed
    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: 20 },
        },
      });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        isGenerating: false,
        error: error.message,
      },
    });

    Sentry.captureException(error);
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

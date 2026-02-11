import { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma.js";
import * as Sentry from "@sentry/node";

const clerkWebHooks = async (req: Request, res: Response) => {
  try {
    // 🔐 Verify Clerk webhook
    const evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET!,
    });

    const { data, type } = evt as any;

    switch (type) {

      // 🟢 USER CREATED
      case "user.created": {
        await prisma.user.create({
          data: {
            id: data.id,
            email: data?.email_addresses?.[0]?.email_address,
            name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`,
            image: data?.image_url,
          },
        });
        break;
      }

      // 🟡 USER UPDATED
      case "user.updated": {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data?.email_addresses?.[0]?.email_address,
            name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`,
            image: data?.image_url,
          },
        });
        break;
      }

      // 🔴 USER DELETED
      case "user.deleted": {
        await prisma.user.delete({
          where: { id: data.id },
        });
        break;
      }

      // 💳 PAYMENT SUCCESS (Credits Allocation)
      case "paymentAttempt.updated": {
        if (
          (data.charge_type === "recurring" ||
            data.charge_type === "checkout") &&
          data.status === "paid"
        ) {

          const creditsMap = {
            creator: 120,
            brands: 350,
          };

          const clerkUserId = data?.payer?.user_id;
          const planSlug =
            data?.subscription_items?.[0]?.plan?.slug as keyof typeof creditsMap;

          if (!clerkUserId) {
            return res.status(400).json({ message: "Missing user id" });
          }

          if (!planSlug || !creditsMap[planSlug]) {
            return res.status(400).json({ message: "Invalid plan id" });
          }

          await prisma.user.update({
            where: { id: clerkUserId },
            data: {
              credits: {
                increment: creditsMap[planSlug],
              },
            },
          });
        }
        break;
      }

      default:
        break;
    }

    return res.json({ message: `Webhook received: ${type}` });

  } catch (error: any) {
    Sentry.captureException(error);
    return res.status(500).json({
      message: "Webhook verification failed",
      error: error.message,
    });
  }
};

export default clerkWebHooks;

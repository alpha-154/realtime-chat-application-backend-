import { z } from "zod";

export const createGroupSchema = z.object({
  groupName: z
    .string()
    .min(3, { message: "Group name must be at least 3 characters long" })
    .max(15, { message: "Group name cannot exceed 15 characters" }),
  admin: z.string(),
});

export const updateGroupSchema = z.object({
  groupName: z
    .string()
    .min(3, { message: "Group name must be at least 3 characters long" })
    .max(15, { message: "Group name cannot exceed 15 characters" }),
});


import { z } from "zod";
const loginSchema = z.object({
    userName: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" }),
    password: z
        .string()
        .min(5, { message: "Password must be at least 5 characters long" }),
});
export default loginSchema;

import { Router } from "express";
import { createGroup, getGroups, updateGroup, deleteGroup, searchGroups } from "../controllers/group.controller.js";


const router = Router();

// Route to create a group
router.post("/create", createGroup);
router.get("/getGroups/:userName", getGroups);
router.put("/update/:groupName", updateGroup);
router.delete("/delete/:groupName", deleteGroup);
router.get("/search", searchGroups )

export default router;
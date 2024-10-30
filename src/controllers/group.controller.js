
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { createGroupSchema , updateGroupSchema} from "../schemas/userGroup.schema.js";


export const createGroup = async (req, res) => {
  const result = createGroupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  try {
    const { groupName, admin } = result.data;

    // Find the user by username
    const user = await User.findOne({ userName: admin });
    if (!user) {
      return res.status(400).json({ message: "Provided admin user does not exist!" });
    }

    // Check if a group with the same name already exists
    const isGroupNameUnique = await Group.findOne({ groupName });
    if (isGroupNameUnique) {
      return res.status(400).json({ message: "Group name already exists" });
    }


    // Create the group
    const group = await Group.create({
      groupName,
      members: [user._id],
      admin: user._id, // Use the user's ObjectId directly
    });

    return res.status(201).json({ message: "Group created successfully!", group });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};


export const getGroups = async (req, res) => {
  const { userName } = req.params;
  if( !userName ) {
    return res.status(400).json({ message: "User name is required" });
  }
  
  try {
   const userObjectId = await User.findOne({userName}).select("_id")

    const groups = await Group.find({
      members: { $in: [userObjectId] },
    });
    if(!groups){
      return res.status(404).json({ message: "No groups found" });
    }
    res.status(200).json({ message: "Groups fetched successfully!", groups});
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Server error" });
  }
}

export const updateGroup = async (req, res) => {
  const { groupName } = req.params;
  if( !groupName ) {
    return res.status(400).json({ message: "Group name is required!" });
  }
  const result = updateGroupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }  

  const { userName } = result.data;

  try {
    const group = await Group.findOneAndUpdate({groupName}, { userName }, {
      new: true
    });
    if(!group){
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json({ message: "Group updated successfully!", group});
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Server error" });
  }
}


export const deleteGroup = async (req, res) => {
  const { groupName } = req.params;
  if( !groupName ) {
    return res.status(400).json({ message: "Group name is required!" });
  }
  try {
    const group = await Group.findOneAndDelete({groupName});
    if(!group){
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json({ message: "Group deleted successfully!", group});
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Server error" });
  }
}


// Controller to search groups by username
export const searchGroups = async (req, res) => {
  //add zod validation
  try {
    const { query } = req.query;

    // Use a regex for partial, case-insensitive matching
    const users = await Group.find({
      groupName: { $regex: query, $options: "i" }
    }).select("groupName"); // Only return userName field

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

import mongoose from "mongoose";

const MigrationSchema = new mongoose.Schema({
  taskID: { type: String, required: true },
  migratedTo: { type: String, required: true },
});

// Create a model for the task collection
export default mongoose.model("MigratedTask", MigrationSchema);

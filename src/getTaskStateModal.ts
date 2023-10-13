import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  publicKey: { type: String, unique: true },
  data: {
    taskName: String,
    taskManager: String,
    isWhitelisted: Boolean,
    isActive: Boolean,
    taskAuditProgram: String,
    stakePotAccount: String,
    totalBountyAmount: Number,
    bountyAmountPerRound: Number,
    currentRound: Number,
    availableBalances: Object,
    stakeList: Object,
    startingSlot: Number,
    isRunning: Boolean,
    hasError: Boolean,
    metadataCID: String,
    minimumStakeAmount: Number,
    roundTime: Number,
    submissions: Object,
    submissionWindow: Number,
    auditWindow: Number,
    distributionsAuditTrigger: Object,
    submissionsAuditTrigger: Object,
  },
});

// Create a model for the task collection
export default mongoose.model("Task", TaskSchema);

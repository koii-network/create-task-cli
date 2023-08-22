import Joi from "joi";
//import { Web3Storage } from "web3.storage";

interface Task {
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  total_bounty_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}
interface UpdateTask {
  task_id: string;
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}
interface TaskMetadata {
  author: string;
  description: string;
  repositoryUrl: string;
  createdAt: number;
  imageUrl?: string | undefined;
  requirementsTags?: RequirementTag[];
}

interface RequirementTag {
  type: RequirementType;
  value?: string | string[]; // defined if given requirement needs a specific value
  description?: string;
}

enum RequirementType {
  GLOBAL_VARIABLE = "GLOBAL_VARIABLE",
  TASK_VARIABLE = "TASK_VARIABLE",
  CPU = "CPU",
  RAM = "RAM",
  STORAGE = "STORAGE",
  NETWORK = "NETWORK",
  ARCHITECTURE = "ARCHITECTURE",
  OS = "OS",
}
const requirementTagSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(RequirementType))
    .required(),
  value: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
  description: Joi.string().optional(),
});
const taskMetadataSchema = Joi.object({
  author: Joi.string().required(),
  description: Joi.string().required(),
  repositoryUrl: Joi.string().uri().required(),
  createdAt: Joi.number().required(),
  imageUrl: Joi.string().allow("").optional().uri(),
  requirementsTags: Joi.array().items(requirementTagSchema).optional(),
});
const taskSchema = Joi.object({
  update: Joi.boolean().optional(),
  task_name: Joi.string().required(),
  task_executable_network: Joi.string()
    .valid("DEVELOPMENT", "ARWEAVE", "IPFS")
    .required(),
  secret_web3_storage_key: Joi.string().required(),
  task_audit_program: Joi.string(),
  task_id: Joi.string().min(32).when("update", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  task_audit_program_id: Joi.string()
    .when("task_executable_network", {
      is: Joi.valid("DEVELOPMENT", "ARWEAVE"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .max(64),
  round_time: Joi.number().required(),
  audit_window: Joi.number().required(),
  submission_window: Joi.number().required(),
  minimum_stake_amount: Joi.number().required(),
  total_bounty_amount: Joi.number()
    .when("update", {
      is: true,
      then: Joi.forbidden(),
      otherwise: Joi.required(),
    })
    .min(10)
    .message("Total bounty amount cannot be less than 10 KOII"),
  bounty_amount_per_round: Joi.number().required(),
  allowed_failed_distributions: Joi.number().required(),
  space: Joi.number()
    .required()
    .min(1)
    .message("Space cannot be less than 1 mb"),
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function main(
  metaData: TaskMetadata,
  task: Task | UpdateTask,
  update = false
) {
  let isValid = true;

  const validatedTask = taskSchema.validate(
    { ...task, update },
    { abortEarly: false }
  );
  if (validatedTask.error) {
    isValid = false;
    console.log(
      validatedTask.error.details.map((detail) => detail.message).join(", ")
    );
  }
  if (!update) {
    if (task.bounty_amount_per_round > (task as Task).total_bounty_amount) {
      isValid = false;
      console.log(
        "Bounty amount per round cannot be greater than total bounty amount"
      );
    }
  }
  const validatedTaskMetadata = taskMetadataSchema.validate(metaData, {
    abortEarly: false,
  });
  if (validatedTaskMetadata.error) {
    isValid = false;
    console.log(
      validatedTaskMetadata.error.details
        .map((detail) => detail.message)
        .join("\n ")
    );
  }

  return !isValid ? process.exit(1) : true;
}

export default main;

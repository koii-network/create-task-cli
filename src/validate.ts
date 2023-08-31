import Joi from "joi";
import chalk from "chalk";
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
const errors = []

interface TaskMetadata {
  author: string;
  description: string;
  repositoryUrl: string;
  createdAt: number;
  migrationDescription?: string;
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
  imageUrl: Joi.string().uri().optional().allow(null,""),
  requirementsTags: Joi.array().items(requirementTagSchema).optional(),
});
const taskSchema = Joi.object({
  task_name: Joi.string().required(),
  task_executable_network: Joi.string()
    .valid("DEVELOPMENT", "ARWEAVE", "IPFS")
    .required(),
  secret_web3_storage_key: Joi.string().required(),
  task_audit_program: Joi.string().when("task_executable_network", {
    is: "IPFS",
    then: Joi.required(),
    otherwise: Joi.optional(),
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
    .required()
    .min(10)
    .message("Total bounty amount cannot be less than 10 KOII"),
  bounty_amount_per_round: Joi.number()
    .required()
    .max(Joi.ref("total_bounty_amount")),
  allowed_failed_distributions: Joi.number().required(),
  space: Joi.number()
    .required()
    .min(1)
    .message("Space cannot be less than 1 mb"),
});

async function main(metaData: TaskMetadata, task: Task) {
  const error: any = {};
  const {
    author,
    description,
    repositoryUrl,
    createdAt,
    requirementsTags,
  } = metaData;
  let isValid;

  const validatedTask = taskSchema.validate(task, { abortEarly: false });
  if (validatedTask.error) {
    isValid = false;
    console.log(
      validatedTask.error.details
        .map((detail) => chalk.bold.red(detail.message))
        .join("\n")
    );
  }
  const validatedTaskMetadata = taskMetadataSchema.validate(metaData, {
    abortEarly: false,
  });
  if (validatedTaskMetadata.error) {
    isValid = false;
    
    console.log(
      validatedTaskMetadata.error.details
        .map((detail) => chalk.bold.red(detail.message))
        .join("\n")
    );
  }

  return !isValid ? process.exit(1) : true;
}

export default main;

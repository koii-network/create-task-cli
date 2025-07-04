export interface Task {
  task_name: string;
  task_executable_network: 'DEVELOPMENT' | 'ARWEAVE' | 'IPFS';
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
  task_type: string;
  token_type: string;
}

export interface TaskMetadata {
  author: string;
  description: string;
  repositoryUrl: string;
  createdAt: number;
  migrationDescription?: string;
  imageUrl?: string | undefined;
  requirementsTags?: RequirementTag[];
  infoUrl?: string;
  tags?: string; 
  environment?: string;
  koiiOceanUrl?: string;
}

export interface RequirementTag {
  type: RequirementType;
  value?: string | string[]; // defined if given requirement needs a specific value
  description?: string;
}

export enum RequirementType {
  GLOBAL_VARIABLE = 'GLOBAL_VARIABLE',
  TASK_VARIABLE = 'TASK_VARIABLE',
  CPU = 'CPU',
  RAM = 'RAM',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  ARCHITECTURE = 'ARCHITECTURE',
  OS = 'OS',
  ADDON = 'ADDON',
}

async function main(metaData: TaskMetadata, task: Task) {
  const error: any = {};
  const { author, description, repositoryUrl, createdAt, requirementsTags } =
    metaData;

  // Check that requirementsTags is an array of non-empty strings
  if (requirementsTags !== undefined) {
    const result: boolean = validateRequirementsTags(requirementsTags);
    if (!result) {
      error['requirementsTags'] =
        'tags do not have valid types or the values specified are not acceptable';
    }
  }



  // Check if all required properties are present and have valid values

  const missingParams = [];

  if (!task.task_name) missingParams.push('task_name');
  if (!task.task_executable_network) missingParams.push('task_executable_network');
  if (!task.round_time) missingParams.push('round_time');
  if (!task.audit_window) missingParams.push('audit_window');
  if (!task.submission_window) missingParams.push('submission_window');
  if (!task.minimum_stake_amount) missingParams.push('minimum_stake_amount');
  if (!task.total_bounty_amount) missingParams.push('total_bounty_amount');
  if (!task.allowed_failed_distributions) missingParams.push('allowed_failed_distributions');
  if (!task.space) missingParams.push('space');
  if (!task.task_type) missingParams.push('task_type')
  if (!task.token_type) missingParams.push('token_type')
  if (typeof author !== 'string' || author.trim().length === 0) {
    missingParams.push('author');
  }
  
  if (typeof description !== 'string' || description.trim().length === 0) {
    missingParams.push('description');
  }
  
  if (typeof repositoryUrl !== 'string' || repositoryUrl.trim().length === 0) {
    missingParams.push('repositoryUrl');
  }
  
  if (typeof createdAt !== 'number') {
    missingParams.push('createdAt');
  }

  
  if (missingParams.length > 0) {
    error['taskParams'] = 'Task Params Missing: ' + missingParams.join(', ');
  }


  // task_name cannot be greater than 24  characters
  if (task.task_name.length > 24) {
    error['task_name'] = 'cannot be more than 24 characters long';
  }

  if (
    task.task_executable_network !== 'DEVELOPMENT' &&
    task.task_executable_network !== 'ARWEAVE' &&
    task.task_executable_network !== 'IPFS'
  ) {
    // Check if task_executable_network is a valid value
    error['task_executable_network'] =
      'Unacceptable values. Network value can only be DEVELOPMENT , ARWEAVE or IPFS';
  }

  // Check if all properties have valid types and values
  if (
    typeof task.task_name !== 'string' ||
    typeof task.round_time !== 'number' ||
    typeof task.audit_window !== 'number' ||
    typeof task.submission_window !== 'number' ||
    typeof task.minimum_stake_amount !== 'number' ||
    typeof task.total_bounty_amount !== 'number' ||
    typeof task.bounty_amount_per_round !== 'number' ||
    typeof task.allowed_failed_distributions !== 'number' ||
    typeof task.space !== 'number' ||
    task.round_time <= 0 ||
    task.audit_window <= 0 ||
    task.submission_window <= 0 ||
    task.minimum_stake_amount <= 0 ||
    task.total_bounty_amount <= 0 ||
    task.allowed_failed_distributions < 0 ||
    task.space <= 0
  ) {
    error['taskParams'] = 'type error in task params';
  }

  // Check audit properties

  if (
    task.task_executable_network == 'DEVELOPMENT' ||
    task.task_executable_network == 'ARWEAVE'
  ) {
    if (!task.task_audit_program_id) {
      error['task_audit_program_id'] = 'Missing';
    } else if (task.task_audit_program_id.length > 64) {
      error['task_audit_program_id'] = 'cannot be more than 64 characters';
    }
  }
  if (task.task_executable_network == 'IPFS') {
    if (!task.task_audit_program) {
      error['task_audit_program'] = 'Missing';
    }
  }

  // check the rewards allocated
  if (task.total_bounty_amount < 10) {
    error['total_bounty_amount'] =
      'Total bounty amount cannot be less than 10 KOII';
  }

  if (task.bounty_amount_per_round > task.total_bounty_amount) {
    error['bounty_amount_per_round'] =
      'cannot be more than total bounty amount';
  }

  if (task.space < 0.1 || task.space > 50) {
    error['space'] = 'Space must be between 0.1 MB and 50 MB';
  }

  if (!isObjectEmpty(error)) {
    console.error('\x1b[31m', `ERROR ${JSON.stringify(error)}`);
    console.log('\x1b[30m', 'Please resolve these issues');
    process.exit();
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isObjectEmpty(obj: object): boolean {
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}


function validateRequirementsTags(requirementsTags: RequirementTag[]): boolean {
  for (const tag of requirementsTags) {
    if (!tag.type || !(tag.type in RequirementType)) {
      //console.error(`Invalid requirement tag: ${JSON.stringify(tag)}`);
      return false;
    }
    switch (tag.type) {
      case RequirementType.GLOBAL_VARIABLE:
      case RequirementType.TASK_VARIABLE:
        if (tag.value && typeof tag.value !== 'string') {
          console.error(
            `Invalid value for ${tag.type} requirement: ${tag.value}`,
          );
          return false;
        }
        break;
      case RequirementType.CPU:
      case RequirementType.ADDON:
      case RequirementType.RAM:
      case RequirementType.STORAGE:
      case RequirementType.NETWORK:
      case RequirementType.ARCHITECTURE:
      case RequirementType.OS:
        if (!tag.value || typeof tag.value !== 'string') {
          console.error(
            `Invalid value for ${tag.type} requirement: ${tag.value}`,
          );
          return false;
        }
        break;
      default:
        console.error(`Unknown requirement type: ${tag.type}`);
        return false;
    }
  }
  return true;
}

export default main;

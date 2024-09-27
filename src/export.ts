// Import necessary functions from the task_contract module
import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  updateTask,
  SetActive,
  ClaimReward,
  FundTask,
  Withdraw,
} from './koii_task_contract/koii_task_contract';

import {
  createTask as KPLCreateTask,
  establishPayer as KPLEstablishPayer,
  establishConnection as KPLEstablishConnection,
  checkProgram as KPLCheckProgram,
  FundTask as KPLFundTask,
  ClaimReward as KPLClaimReward,
  SetActive as KPLSetActive,
  Withdraw as KPLWithdraw,
  updateTask as KPLUpdateTask,
} from './kpl_task_contract/task-program';

import downloadRepo from './utils/download_repo'
import { getTaskStateInfo, parseKPLTaskStateInfo, parseKoiiTaskStateInfo } from './utils/task_state';
import { checkIsKPLTask } from './utils/task_type';

// Export the FundTask function
export {
  FundTask,
  establishConnection,
  checkProgram,
  createTask,
  updateTask,
  SetActive,
  Withdraw,
  ClaimReward,
  establishPayer,
};
export {
  KPLFundTask,
  KPLEstablishPayer,
  KPLEstablishConnection,
  KPLCheckProgram,
  KPLCreateTask,
  KPLClaimReward,
  KPLSetActive,
  KPLWithdraw,
  KPLUpdateTask,
};

export {
  downloadRepo,
  getTaskStateInfo,
  parseKPLTaskStateInfo, 
  parseKoiiTaskStateInfo,
  checkIsKPLTask
};
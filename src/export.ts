

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
  Whitelist as KPLWhitelist,
  DeleteTask as KPLDeleteTask
} from './kpl_task_contract/task-program';

// Export the FundTask function

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
  KPLWhitelist, 
  KPLDeleteTask
};

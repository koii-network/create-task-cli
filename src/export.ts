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
    FundTaskFromMiddleAccount,
} from "./task_contract";

// Export the FundTask function
export { FundTask, establishConnection, checkProgram, createTask, updateTask, SetActive, FundTaskFromMiddleAccount, Withdraw, ClaimReward, establishPayer}; 

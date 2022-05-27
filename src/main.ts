/**
 * Hello world
 */

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  submitTask,
  SetTaskToVoting,
  Vote,
  Whitelist,
  SetActive,
  Payout,
  ClaimReward,
  FundTask
} from './task_contract';
import prompts from 'prompts';

async function main() {
  console.log("Let's say hello to a Solana account...");
  const mode = (
    await prompts({
      type: 'select',
      name: 'mode',
      message: 'Select operation mode',

      choices: [
        { title: 'Service', value: 'service' },
        { title: 'Witness', value: 'witness' }, // Indirect
      ],
    })
  ).mode;
  console.log(mode)
  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();
 
  // Interact with task contract
  console.log('CALLING CREATE TASK');
  let taskStateInfoKeypair = await createTask();
  console.log("TASK STATE INFO KEY:",taskStateInfoKeypair.publicKey.toBase58())
  console.log('CALLING SUBMIT TASK');
  let submitterPubkey= await submitTask(taskStateInfoKeypair);
  console.log('CALLING SetTaskToVoting');
  await SetTaskToVoting(taskStateInfoKeypair);
  console.log('CALLING Vote');
  await Vote(taskStateInfoKeypair, submitterPubkey);
  console.log('CALLING Whitelist');
  await Whitelist(taskStateInfoKeypair);
  console.log('CALLING SetActive');
  await SetActive(taskStateInfoKeypair);
  console.log('CALLING Payout');
  await Payout(taskStateInfoKeypair);
  console.log('CALLING ClaimReward');
  await ClaimReward(taskStateInfoKeypair);
  console.log('CALLING FundTask');
  await FundTask(taskStateInfoKeypair);
  console.log('Success');
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

# CREATE TASK CLI

## How to run
You can run the create task cli by using the command `npx @_koii/create-task-cli`

## Overview

<p align="center">
  <img src="./Task_contract_flow.png" />
</p>
This utility CLI allows to create tasks on k2 native task contract. Simplifying the process of going through the code to create the tasks. You just need the executable file deployed on arweave and a wallet to fund the task and you should be able to create a task. The functionality of this CLI includes the following:

1. **Create a new task:** As name suggests this option allows you to create new task, once you select this option you will be asked for all necessary inputs required to create a new task.
2. **Set task to voting:** This option allows the task to set task to voting state, The task can have 3 states namely AcceptingSubmissions, AcceptingVotes, Completed.
3. **Whitelist the task:** This option is for KOII only to whitelist the task, once you create a new task it must be whitelisted before it is available for nodes to run.
4. **Mark task as active/ Inactive:** This option allows to mark the task as active or Inactive. By default when a new task is created it is Inactive by default.
5. **Trigger payout:** When the submissions and voting is completed. You can trigger payout. On the basis of the voting/submissions the system will distribute the reward per round to all submissions and voters on the basis of their stake.(The reward won't be distributed but stored in state which can be claimed by voters and submitters)
6. **Claim reward:** The voters and submitters can claim their reward using this option.
7. **Fund task with more KOII:** IF the task is running out of KOII for next rounds this option can be used to fund the task with more KOII.

A KOII task created will be visible to millions of KOII nodes running. They will select to run the task on the basis of the bounty and difficuly (computation requirement of task). Nodes running in Witness mode will only audit the submissions and get a small chunk of bounty and nodes running the full fledge service node will submit the submissions after performing the task and also audit other nodes. Finally, on the basis of staked weighted voting the nodes submitting the correct result will be awarded with bounty and nodes submitting incorrect result will be slashed.

## Steps to create a new task

1. Enter the name of the task: Any Name .. Seriously your choice! E.g: Blazing-Fast-Execution
2. Enter short description of your task: A brief explanation of the task you're creating. Note: The character should not longer than 64 characters.
3. Enter the network to be used to upload your executable [IPFS / ARWEAVE / DEVELOPMENT]:  Choose IPFS or ARWEAVE for storage of your executable file, or DEVELOPMENT if you haven’t developed your task yet.
Note — The next prompt depends on your answer to the prompt above.
4. [For IPFS] Enter the web3.storage API key: If you choose to store your task executable on IPFS, you’ll be required to add your web3.storage API key, visit here to create a web3.storage account. After creating an account, create an API Token for your project, paste the API token on this prompt. e.g: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
5. [For Arweave] Enter Arweave id of the deployed Koii task executable program: If you choose your task executable on Arweave, you have to upload your executable on Arweave and provide the ID to the uploaded file.
6. [For DEVELOPMENT] Enter the name of executable you want to run on task-nodes: Enter a desired name for your task executable, this will be the same name of the executable file that will exist in the task node's executables folder.
7. [For IPFS and ARWEAVE] Enter the path to your executable webpack: Add the absolute path to your executable file. E.g: /Users/<YOUR_HOME>/Documents/testing-task/dist/main.js
8. Enter the round time in slots: The preferred number of slots per round for the task. E.g: 1000
9. Enter the audit window in slots: The number of slots to be allocated to the audit window. E.g: 500
10. Enter the submission window in slots: The number of slots to be allocated to the submission window. E.g: 300
Note — The number of slots in the audit window and submission must be lower than the number of slots per round.
11. Enter the minimum staking amount in lamports: Add the minimum amount node operators should be able to stake on the task. E.g: 50
12. Enter the total bounty you want to allocate for the task (In KOII): Any amount not more than what you have in your wallet though. E.g: 1000 (We suggest the amount could be run at least 4 epochs)
13. Enter the bounty amount per round: Total amount would be divided equally for each number until the bounty fund is exhausted. E.g: 10
14. Enter TaskMetadata CID hosted on IPFS (Leave empty for None): If you've hosted the metadata for your task on IPFS, add the CID here; otherwise, leave blank. Use your web3.storage account, click the Upload Files button, and then upload a JSON file containing the metadata for your task. Add the CID for the uploaded file to this prompt. Check out a metadata example.
15. Enter CID for environment variables hosted on IPFS (Leave empty for None): If your task requires environment variables to be run by node runners, upload a JSON file that contains those variables to IPFS using web3.storage. Add the uploaded file's CID to this prompt.
16. Enter the space, you want to allocate for task account (in MBs): Each task would need some storage for persistence, in general in MBs. E.g: 10
After the final confirmation of y, your task would be created along with  a taskStateInfoKeypair.json which is used to control the task state info.

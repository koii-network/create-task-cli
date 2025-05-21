# Koii Create Task CLI

A powerful CLI tool for creating, managing, and maintaining tasks on the Koii Network, supporting both KOII and KPL task types. This tool streamlines the process of deploying, funding, updating, and interacting with decentralized tasks, with support for asset uploads to IPFS, Arweave, or local development.

---

## Features
- **Create Local Repo**: Bootstrap a new task project from official templates (TypeScript/JavaScript).
- **Deploy a Task**: Create a new task on-chain, with full support for config files or interactive CLI input.
- **Update a Task**: Migrate or update an existing task, including asset and metadata management.
- **Fund Task**: Add additional bounty to an existing task.
- **Activate/Deactivate Task**: Set a task as active or inactive.
- **Claim Reward**: Claim earned rewards for a task (for VPS nodes).
- **Withdraw Stake**: Withdraw staked tokens from a task (for VPS nodes).
- **Upload Assets to IPFS**: Upload executables and metadata to IPFS via KOII Storage SDK or manual CID entry.

---

## Installation

- **Node.js**: Requires Node.js v18 or higher.
- **Install dependencies:**
  ```bash
  yarn install
  # or
  npm install
  ```
- **Build the CLI:**
  ```bash
  yarn build
  # or
  npm run build
  ```
- **Run the CLI:**
  ```bash
  yarn start
  # or
  npx @_koii/create-task-cli
  ```

---

## Usage

When you run the CLI, you'll be presented with an interactive menu:

- **Create Local Repo**: Download a starter template for your task.
- **Deploy a Task**: Create a new task using either a `config-task.yml` file or interactive prompts.
- **Update a Task**: Update an existing task (supports both config file and CLI input).
- **Fund Task**: Add more tokens to a task's bounty pool.
- **Activate/Deactivate Task**: Change the active status of a task.
- **Claim Reward**: Claim rewards for a task.
- **Withdraw Stake**: Withdraw your staked tokens from a task.
- **Upload Assets to IPFS**: Upload your task's executable and metadata to IPFS.

### Example: Creating a Task
1. **Prepare your executable** (e.g., `dist/main.js`).
2. **Fill out `config-task.yml`** (see below for structure).
3. **Run the CLI:**
   ```bash
   npx @_koii/create-task-cli
   # or
   yarn start
   ```
4. **Select 'Deploy a Task'** and follow the prompts (choose config file or CLI input).

---

## Configuration: `config-task.yml`

You can configure your task using a YAML file. Example structure:

```yaml
# Task Name: (Required)
task_name: 'My Task'
# Task Author: (Required)
author: 'Your Name'
# Task Description: (Required)
description: 'Short description of the task.'
# Repository URL: (Required)
repositoryUrl: 'https://github.com/your/repo'
# Image URL: (Required)
imageUrl: 'https://yourdomain.com/image.png'
# Task executable network: (Required | DEVELOPMENT, ARWEAVE, or IPFS)
task_executable_network: 'IPFS'
# Task audit program: (Required)
task_audit_program: 'dist/main.js'
# Round time, audit window, submission window, minimum stake, etc.
round_time: 1500
audit_window: 350
submission_window: 350
minimum_stake_amount: 1.9
task_type: 'KPL' # or 'KOII'
token_type: '...' # Only for KPL
# ... (see full config-task.yml for all options)
```

---

## Wallet & Environment Setup
- You will need a funded Koii wallet (JSON keypair file) for most operations.
- The CLI will prompt for wallet paths as needed.
- For IPFS uploads, you must have a staking wallet with sufficient balance.
- Environment variables can be set in a `.env` file (see `.env.example`).

---

## Advanced Operations
- **Update Task**: Migrate an existing task using updated code or metadata.
- **Fund Task**: Add more tokens to a task's bounty pool.
- **Claim Reward**: Claim rewards for completed work.
- **Withdraw**: Withdraw your staked tokens after task completion.
- **Handle Assets**: Upload or manage task assets on IPFS.

---

## FAQ / Troubleshooting
- **Node version**: Ensure you are using Node.js v18+.
- **`postbuild`**: Requires `cpy-cli` (install globally with `npm install -g cpy-cli` if needed).
- **Wallet errors**: Ensure your wallet files are valid and funded.
- **IPFS uploads**: Requires a staking wallet and sufficient balance.

---

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss your proposed changes.

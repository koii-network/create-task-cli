import path from 'path';
import fs from 'fs';
import { promptWithCancel } from './prompts';
import { homedir } from 'os';
import { getConfig } from '../koii_task_contract/utils';
import { createStakingAccount } from './create-staking-wallet';
import { Connection, Keypair } from '@_koii/web3.js';
export async function getSubmitterWalletPath() {
  let submitterWalletPath = (
    await promptWithCancel({
      type: 'text',
      name: 'submitterWalletPath',
      message: 'Enter the submitter wallet path address',
    })
  ).submitterWalletPath;
  submitterWalletPath = sanitizePath(submitterWalletPath);
  return submitterWalletPath;
}
export async function getClaimerWalletPath() {
  let claimerWalletPath = (
    await promptWithCancel({
      type: 'text',
      name: 'claimerKeypair',
      message: 'Enter the path to Claimer wallet',
    })
  ).claimerKeypair;
  claimerWalletPath = sanitizePath(claimerWalletPath);
  return claimerWalletPath;
}
export async function getYmlPath() {
  const currentDir = path.resolve(process.cwd());
  let ymlPath = `${currentDir}/config-task.yml`;

  if (!fs.existsSync(ymlPath)) {
    ymlPath = (
      await promptWithCancel({
        type: 'text',
        name: 'ymlPath',
        message: 'Enter the path to your config-task.yml file',
      })
    ).ymlPath;
    ymlPath = sanitizePath(ymlPath);
    if (
      !fs.existsSync(ymlPath) ||
      (!ymlPath.includes('.yml') && !ymlPath.includes('.yaml'))
    ) {
      console.error(`❌ config-task.yml file not found at: ${ymlPath}`);
      console.info(
        `💡 Tip: Make sure the path is correct and points to a .yml or .yaml file.`,
      );
      console.info(`Example: ./config-task.yml`);
      process.exit(1);
    }
  }

  return ymlPath;
}
export async function getPayerWalletPath() {
  let config;
  let walletPath;
  try {
    config = await getConfig();
    walletPath = config.keypair_path;
  } catch (error) {
    walletPath = path.resolve(homedir(), '.config', 'koii', 'id.json');
  }
  let isConfirm = true;
  if (fs.existsSync(walletPath)) {
    isConfirm = (
      await promptWithCancel({
        type: 'confirm',
        name: 'value',
        initial: true,
        message: `Would you like to use your koii cli key (${walletPath}) as the fee payer wallet?`,
      })
    ).value;
  }
  if (!fs.existsSync(walletPath) || !isConfirm) {
    // Above check is for the koii cli wallet config file
    const mainWalletDesktopNodePath =
      getWalletPathFromDesktopNode('MainWallet');
    if (mainWalletDesktopNodePath && fs.existsSync(mainWalletDesktopNodePath)) {
      isConfirm = (
        await promptWithCancel({
          type: 'confirm',
          initial: true,
          name: 'value',
          message: `Would you like to use your desktop node key (${mainWalletDesktopNodePath}) as the fee payer wallet?`,
        })
      ).value;
      if (isConfirm) {
        walletPath = mainWalletDesktopNodePath;
      }
    }
    if (!fs.existsSync(walletPath) || !isConfirm) {
      walletPath = (
        await promptWithCancel({
          type: 'text',
          name: 'walletPath',
          message: 'Enter the path to your wallet',
        })
      ).walletPath;
      walletPath = sanitizePath(walletPath);
      if (!fs.existsSync(walletPath)) {
        console.error(`❌ Wallet file not found at: ${walletPath}`);
        console.info(
          `💡 Make sure the path is correct and points to a valid KOII wallet JSON file.`,
        );
        console.info(`📦 You can use a wallet from either:`);
        const koiiDesktopNodePath = getKoiiDesktopNodePath();
        console.info(
          `   • KOII Desktop Node: ${koiiDesktopNodePath}/wallets/<name>_mainSystemWallet.json`,
        );
        console.info(`   • KOII CLI: Generate one using the CLI tool.`);
        console.info(
          `     Install CLI → https://www.koii.network/docs/develop/command-line-tool/koii-cli/install-cli`,
        );
        console.info(
          `     Create a wallet → https://www.koii.network/docs/develop/command-line-tool/koii-cli/create-wallet`,
        );
        process.exit(1);
      }
    }
  }

  return walletPath;
}

export async function getStakingWalletPath(connection: Connection, payerWallet: Keypair) {
  const stakingWalletDesktopNodePath =
    getWalletPathFromDesktopNode('StakingWallet');
  let stakingWalletPath;
  let isConfirm = true;
  if (
    stakingWalletDesktopNodePath &&
    fs.existsSync(stakingWalletDesktopNodePath)
  ) {
    isConfirm = (
      await promptWithCancel({
        type: 'confirm',
        name: 'value',
        message: `Would you like to use your desktop node staking key (${stakingWalletDesktopNodePath}) to sign this upload to IPFS?`,
        initial: true,
      })
    ).value;
    if (isConfirm) {
      stakingWalletPath = stakingWalletDesktopNodePath;
    }
  }
  if (!fs.existsSync(stakingWalletPath || '') || !isConfirm) {
    const { nextStep } = await promptWithCancel({
      type: 'select',
      name: 'nextStep',
      message: 'No staking wallet selected. What would you like to do?',
      choices: [
        {
          title: '🆕 Create a new staking wallet',
          value: 'createNew',
        },
        {
          title: '🔑 Enter path to an existing staking wallet',
          value: 'enterPath',
        },
        {
          title: '❌ Cancel',
          value: 'cancel',
        },
      ],
    });
    if (nextStep === 'createNew') {
      const stakingAccKeypair = await createStakingAccount(connection, payerWallet);
      fs.writeFileSync("./staking-wallet.json", JSON.stringify(Array.from(stakingAccKeypair.secretKey)));
      return "./staking-wallet.json";
    }
    if (nextStep === 'cancel') {
      console.log('Operation cancelled by user.');
      process.exit(0);
    }
    if (nextStep === 'enterPath') {
      // ask user to enter the stakingWallet Keypair path
      stakingWalletPath = (
        await promptWithCancel({
          type: 'text',
          name: 'stakingWalletPath',
          message: 'Enter the path to your staking wallet',
        })
      ).stakingWalletPath;

      stakingWalletPath = sanitizePath(stakingWalletPath);
      if (!fs.existsSync(stakingWalletPath)) {
        console.error(
          `❌ Staking Wallet file not found at: ${stakingWalletPath}`,
        );
        console.info(
          `💡 Tip: Make sure the path is correct and points to a .json staking wallet file.`,
        );
        const koiiDesktopNodePath = getKoiiDesktopNodePath();
        console.info(`🔍 If you're using KOII Desktop Node, check here:`);
        console.info(
          `Example: ${koiiDesktopNodePath}/namespace/<your_wallet_name>_stakingWallet.json`,
        );
        process.exit(1);
      }
    }
  }
  if (!stakingWalletPath) {
    console.error('No staking wallet selected');
    process.exit(1);
  }
  return stakingWalletPath;
}

export function sanitizePath(path: string) {
  let sanitizedPath = path.trim();
  sanitizedPath = sanitizedPath.replace(/[<>"'|?*]/g, '');
  return sanitizedPath;
}

export function getWalletPathFromDesktopNode(type: string) {
  try {
    let desktopNodeFolderLocation = getKoiiDesktopNodePath();
    if (type == 'StakingWallet') {
      desktopNodeFolderLocation = path.join(
        desktopNodeFolderLocation,
        'namespace',
      );
      const files = fs.readdirSync(desktopNodeFolderLocation);
      if (!files || files.length == 0) {
        return null;
      }
      const stakingWalletPath = files.find((e) =>
        e.includes('stakingWallet.json'),
      );
      return path.join(desktopNodeFolderLocation, stakingWalletPath || '');
    } else if (type == 'MainWallet') {
      desktopNodeFolderLocation = path.join(
        desktopNodeFolderLocation,
        'wallets',
      );
    } else {
      throw new Error('INVALID TYPE');
    }
    const files = fs.readdirSync(desktopNodeFolderLocation);
    if (!files || files.length == 0) {
      return null;
    }
    const mainSystemWallet = files.find((e) =>
      e.includes('mainSystemWallet.json'),
    );
    return path.join(desktopNodeFolderLocation, mainSystemWallet || '');
  } catch (error) {
    return null;
  }
}

function getKoiiDesktopNodePath() {
  let basePath;

  switch (process.platform) {
    case 'darwin': // MacOS
      basePath = path.join(
        process.env.HOME || '',
        'Library',
        'Application Support',
        'KOII-Desktop-Node',
      );
      break;
    case 'win32': // Windows
      basePath = path.join(process.env.APPDATA || '', 'KOII-Desktop-Node');
      break;
    case 'linux': // Linux
      basePath = path.join(
        process.env.HOME || '',
        '.config',
        'KOII-Desktop-Node',
      );
      break;
    default:
      throw new Error('Unsupported operating system');
  }

  return basePath;
}

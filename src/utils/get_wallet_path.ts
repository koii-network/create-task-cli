import path from 'path';
import fs from 'fs';
import { promptWithCancel } from './prompts';
import { homedir } from 'os';
import { getConfig } from '../koii_task_contract/utils';
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
      throw Error(
        'Please make sure that the path to your config-task.yml file is correct.',
      );
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
        throw Error('Please make sure that the wallet path is correct');
      }
    }
  }

  return walletPath;
}

export async function getStakingWalletPath() {
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
    // ask user to enter the stakingWallet Keypair path
    stakingWalletPath = (
      await promptWithCancel({
        type: 'text',
        name: 'stakingWalletPath',
        message: 'Enter the path to your staking wallet',
      })
    ).stakingWalletPath;
  }
  stakingWalletPath = sanitizePath(stakingWalletPath);
  if (!fs.existsSync(stakingWalletPath)) {
    throw Error('Please make sure that the staking wallet path is correct');
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
    console.error(error);
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

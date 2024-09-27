import { KoiiProgramID, KPLProgramID } from '../constant';
import { Connection, PublicKey } from '@_koii/web3.js';
export async function checkIsKPLTask(accountInfo: any) {
    if (accountInfo) {
      const owner = accountInfo.owner.toBase58();
      if (owner == KPLProgramID) {
        console.log(`On KPL Task Operations`);
        return true;
      }
      if (owner == KoiiProgramID) {
        console.log(`On Koii Task Operations`);
        return false;
      }
      throw Error('Task ID Not Correct');
    }
  }
  
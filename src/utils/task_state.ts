import { Connection, PublicKey } from '@_koii/web3.js';
import { checkIsKPLTask } from './task_type'; 
import { parseKPLTaskStateInfo } from '../kpl_task_contract/util';
import { parseKoiiTaskStateInfo } from '../koii_task_contract/utils';
async function getTaskStateInfo(
    connection: Connection,
    taskStateInfoAddress: string,
  ) {
    const taskState = await connection.getAccountInfo(
      new PublicKey(taskStateInfoAddress),
    );
    if (taskState && taskState.data) {
      const IsKPLTask = await checkIsKPLTask(taskState)
      if (IsKPLTask) {
        const parsedKPLTaskState = await parseKPLTaskStateInfo(taskState);

        return parsedKPLTaskState;
      } else {
        const parsedKoiiTaskState = await parseKoiiTaskStateInfo(taskState)
        
        return parsedKoiiTaskState
      }
    } else {
      throw 'Task not found';
    }
}

export { getTaskStateInfo, parseKPLTaskStateInfo, parseKoiiTaskStateInfo };
/**
 *  'is_allowlisted' : boolean
  'is_active' : boolean
  'task_name' : string,
  'task_description': string,
  'task_manager': string,
  'task_audit_program': string,
  'stake_pot_account',
  'stake_pot_seed'? only KPL have string,
  'stake_pot_bump'? only KPL have int,
  'submissions',     [HHn4M2XNyyqYZxPi5QqJb5bgkCPyx9fJp1VYVPj43db: {
      submission_value: 'bafybeian4kki6mya44wsizfjbcyihvp4e3s5m3rhnjshy5g3yltyvttcmy',
      slot: 41332742
}]
  'submissions_audit_trigger',
  'total_bounty_amount' int,
  'bounty_amount_per_round' int,
  'token_type'? only KPL have int,
  'total_stake_amount' int,
  'minimum_stake_amount' int,
  'available_balances', {string:int}
  'stake_list',{string:int}
  'ip_address_list', {string: string} ===not confirmed==
  'round_time', int 
  'starting_slot', int 
  'audit_window', int 
  'submission_window', int 
  'task_executable_network', string
  'distribution_rewards_submission',  KPL:  [ '198': {
    '4h5fr3dfKxhJfDsHpMYcexmAjniYu5C16tdr4VenfAQk': {
      submission_value: '4h5fr3dfKxhJfDsHpMYcexmAjniYu5C16tdr4VenfAQk',
      slot: 41396555,
      round: 198
    } 
} ] ; KOII:[ '198': {
    '4h5fr3dfKxhJfDsHpMYcexmAjniYu5C16tdr4VenfAQk': {
      submission_value: '4h5fr3dfKxhJfDsHpMYcexmAjniYu5C16tdr4VenfAQk',
      slot: 41396555
    } 
} ]
  'distributions_audit_trigger',   '198': {
    '4h5fr3dfKxhJfDsHpMYcexmAjniYu5C16tdr4VenfAQk': {
      trigger_by: '5PWLUHqpehKTvvuzBVfSHG8zWyNjKikWCG9kcordN5Da',
      slot: 41399907,
      votes: [Array]
    }
  }
  'distributions_audit_record',
  'task_metadata',
  'task_vars',
  'is_migrated' boolean,
  'migrated_to',
  'allowed_failed_distributions'
 */
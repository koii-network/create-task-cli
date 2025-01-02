import {
  Connection,
  Transaction,
  sendAndConfirmTransaction,
} from '@_koii/web3.js';
import ora from 'ora';
export async function sendAndConfirmTransactionWithRetries(
  connection: Connection,
  transaction: Transaction,
  signerList: any,
  transactionRetryNumber = 10,
) {
  const spinner = ora(`Sending Transactions`).start();
  for (let i = 0; i < transactionRetryNumber; i++) {
    const result = await sendAndDoubleConfirmTransaction(
      connection,
      transaction,
      signerList,
    );
    if (result?.status == 'Success') {
      spinner.succeed(
        `Transaction Confirmed with Signature ${result.signature}`,
      );
      return result.signature;
    }
    if (result?.status == 'Failed') {
      spinner.text = `Retrying Transaction`;
      continue;
    }
    if (result?.status == 'Unknown') {
      spinner.fail(
        `Unknown Signature Status with Signature https://explorer.koii.live/tx/${result.signature}. The operation status is unknown. Please check the transaction status manually on the explorer. `,
      );
    }
  }
  throw Error("Failed to send the transaction after 10 retries");
}

export async function sendAndDoubleConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  signerList: any,
  confirmationRetryNumber = 10,
) {
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      signerList,
    );
    return { status: 'Success', signature: signature };
  } catch (error: any) {
    // Try to extract the signature from the error object
    const signatureMatch = error.message.match(/signature (\w+)/);
    const signature = signatureMatch
      ? signatureMatch[1]
      : 'Signature not found';
    if (signature == 'Signature not found') {
      console.log(error);
      return { status: 'Failed', signature: null };
    }
    try {
      for (let i = 0; i < confirmationRetryNumber; i++) {
        const result = await connection.getSignatureStatus(signature);
        if (result?.value?.err != null) {
          console.log('Transaction Error.');
          console.log(error);
          return { status: 'Failed', signature: signature };
        }
        if (
          result?.value?.confirmationStatus == 'finalized' ||
          result?.value?.confirmationStatus == 'confirmed'
        ) {
          console.log('Transaction is Confirmed!');
          return { status: 'Success', signature: signature };
        }
        if (result?.value?.confirmationStatus == 'processed') {
          console.log('Transaction Processing.');
          continue;
        }

        console.log('Transaction Status Not Retrieved. Retrying...');
        console.log(result);
      }
      return { status: 'Unknown', signature: signature };
    } catch (statusError) {
      console.error('Error checking transaction status:', statusError);
      return { status: 'Unknown', signature: signature };
    }
  }
}

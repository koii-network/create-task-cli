import prompts from 'prompts';
import chalk from 'chalk';
export async function promptWithCancel(questions: any) {
  const response = await prompts(questions, {
    onCancel: () => {
      console.log(
        chalk.red.bold('\nCreate Task CLI Stopped Due to Manual Interruption.'),
      );
      process.exit(0);
    },
  });
  return response;
}

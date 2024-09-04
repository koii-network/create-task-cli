import ora from 'ora';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import StreamZip from 'node-stream-zip';
const downloadRepo = async () => {
  const repoZipUrl =
    'https://github.com/koii-network/task-template/archive/refs/heads/master.zip';
  const outputPath = path.resolve(process.cwd(), 'task-template.zip');
  const outputDir = path.resolve(process.cwd(), 'task-template');

  const spinner = ora('Downloading repository...').start();

  try {
    const res = await fetch(repoZipUrl);
    if (!res.ok) throw new Error('Failed to download the repository');

    const fileStream = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    spinner.succeed(chalk.green(`Download completed, saved as ${outputPath}`));

    spinner.start('Extracting repository...');
    const zip = new StreamZip.async({ file: outputPath });
    await zip.extract(null, outputDir);
    await zip.close();

    spinner.succeed(
      chalk.green(`Repository has been extracted to ${outputDir}`),
    );
    console.log(
      chalk.blue(
        'Template creation complete! Please check https://github.com/koii-network/ezsandbox/tree/main/ for dev guide! Happy coding!',
      ),
    );
  } catch (error: any) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
  } finally {
    // Clean up the zip file after extraction
    fs.unlink(outputPath, (err) => {
      if (err) {
        console.error(
          chalk.red(`Error removing temporary zip file: ${err.message}`),
        );
      } else {
        console.log(chalk.yellow(`Temporary zip file removed.`));
      }
    });
  }
};
export default downloadRepo;

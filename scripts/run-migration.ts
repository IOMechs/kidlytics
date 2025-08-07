
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { exec } from 'child_process';

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

const runMigration = async () => {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(file => file.endsWith('.ts'));

    if (files.length === 0) {
      console.log('No migration scripts found in the migrations directory.');
      return;
    }

    const { migrationToRun } = await inquirer.prompt([
      {
        type: 'list',
        name: 'migrationToRun',
        message: 'Which migration would you like to run?',
        choices: files,
      },
    ]);

    const scriptPath = path.join(MIGRATIONS_DIR, migrationToRun);
    console.log(`Executing migration: ${migrationToRun}...`);

    const child = exec(`tsx ${scriptPath}`);

    child.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    child.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    child.on('close', (code) => {
      console.log(`Migration script finished with code ${code}.`);
    });

  } catch (error) {
    console.error('An error occurred while running the migration:', error);
  }
};

runMigration();

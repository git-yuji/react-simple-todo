import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 600_000,
  reporter: [['list', { printSteps: true }]],
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    launchOptions: executablePath ? {
      executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process'],
    } : {},
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    timeout: 120_000,
  },
});

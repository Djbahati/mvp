import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

console.log('[Dev-Script] Validating environment and dependencies...');

const requiredModules = ['node_modules', 'node_modules/vite', 'node_modules/express'];
const missing = requiredModules.filter((mod) => !existsSync(path.join(process.cwd(), mod)));

if (missing.length > 0) {
  console.error(`[Dev-Script] Missing dependencies: ${missing.join(', ')}. Please run 'npm install'.`);
  process.exit(1);
}

console.log('[Dev-Script] Dependencies verified. Booting dev server on http://0.0.0.0:3000...');

const child = spawn('npx', ['tsx', 'server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '3000',
    HOST: '0.0.0.0',
  },
});

child.on('error', (err) => {
  console.error('[Dev-Script] Failed to spawn dev server process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Dev-Script] Dev server exited with code ${code}`);
    process.exit(code);
  }
});

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Clean npm lifecycle environment variables to prevent EALLOWSCRIPTS in nested npm runs
const cleanEnv = { ...process.env };
Object.keys(cleanEnv).forEach((k) => {
  if (k.startsWith('npm_') || k.startsWith('NPM_')) {
    delete cleanEnv[k];
  }
});

console.log('🚀 [Build] Installing client dependencies (including Vite)...');
const clientInstall = spawnSync(npmCmd, ['install'], {
  cwd: path.join(__dirname, 'client'),
  env: cleanEnv,
  stdio: 'inherit',
  shell: true
});
if (clientInstall.status !== 0) {
  console.error('❌ Failed to install client dependencies');
  process.exit(clientInstall.status || 1);
}

console.log('📦 [Build] Building client production bundle with Vite...');
const clientBuild = spawnSync(npmCmd, ['run', 'build'], {
  cwd: path.join(__dirname, 'client'),
  env: cleanEnv,
  stdio: 'inherit',
  shell: true
});
if (clientBuild.status !== 0) {
  console.error('❌ Failed to build client bundle');
  process.exit(clientBuild.status || 1);
}

console.log('⚙️ [Build] Installing server dependencies...');
const serverInstall = spawnSync(npmCmd, ['install'], {
  cwd: path.join(__dirname, 'server'),
  env: cleanEnv,
  stdio: 'inherit',
  shell: true
});
if (serverInstall.status !== 0) {
  console.error('❌ Failed to install server dependencies');
  process.exit(serverInstall.status || 1);
}

console.log('✅ [Build] Build successfully completed! Production assets ready.');

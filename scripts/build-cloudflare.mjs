import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath,
  [process.env.npm_execpath, 'run', 'build', '--workspace=client'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_AUTH_MODE: 'firebase', VITE_API_BASE_URL: '/api/v1', VITE_SOCKET_URL: '' },
  });
process.exit(result.status ?? 1);

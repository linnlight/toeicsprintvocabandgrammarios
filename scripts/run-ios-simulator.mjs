import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoBinary = path.join(projectRoot, 'node_modules', '.bin', 'expo');

// Xcode updates can leave an older CoreSimulatorService process running. Its
// version then differs from the installed framework and Simulator only shows a
// black screen or a "service is no longer valid" alert. Restart simulator-only
// processes before each internal run; this does not affect project data.
spawnSync('killall', ['Simulator'], { stdio: 'ignore' });
spawnSync('killall', ['-9', 'com.apple.CoreSimulator.CoreSimulatorService'], {
  stdio: 'ignore',
});
spawnSync('killall', ['-9', 'CoreSimulatorService'], { stdio: 'ignore' });

spawnSync('open', ['-a', 'Simulator'], { stdio: 'inherit' });

// Recent Simulator runtimes can remain powered off even when Expo launches the
// app successfully. Wake the booted display while the native build is running.
const wakeTimer = setTimeout(() => {
  spawnSync('xcrun', ['simctl', 'io', 'booted', 'screenConfig', 'power', 'on'], {
    stdio: 'ignore',
  });
}, 2500);

const expo = spawn(expoBinary, ['run:ios'], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => expo.kill(signal));
}

expo.on('exit', (code, signal) => {
  clearTimeout(wakeTimer);
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});

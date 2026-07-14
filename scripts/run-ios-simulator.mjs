import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoBinary = path.join(projectRoot, 'node_modules', '.bin', 'expo');
const metroHost = '127.0.0.1';
const metroPort = 8081;
const metroStatusUrl = `http://${metroHost}:${metroPort}/status`;

let metro;
let ios;
let shuttingDown = false;
let metroSpawnError;

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: metroHost, port: metroPort });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

function isMetroReady() {
  return new Promise((resolve) => {
    const request = http.get(metroStatusUrl, { timeout: 1000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve(response.statusCode === 200 && body.includes('packager-status:running'));
      });
    });

    request.once('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.once('error', () => resolve(false));
  });
}

async function waitForMetro(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isMetroReady()) return;
    if (metroSpawnError) {
      throw new Error(`Metro could not start: ${metroSpawnError.message}`);
    }
    if (metro?.exitCode !== null) {
      throw new Error(`Metro stopped before it became ready (exit ${metro.exitCode}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Metro did not become ready at ${metroStatusUrl} within 60 seconds.`);
}

function stopChild(child, signal = 'SIGTERM') {
  if (child && child.exitCode === null && !child.killed) child.kill(signal);
}

function shutdown(exitCode = 0, signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopChild(ios, signal ?? 'SIGTERM');
  stopChild(metro, signal ?? 'SIGTERM');
  process.exitCode = exitCode;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0, signal));
}

async function main() {
  if (await isPortOpen()) {
    if (!(await isMetroReady())) {
      throw new Error(
        `Port ${metroPort} is already used by another process. Stop that process, then run npm run ios again.`,
      );
    }
    console.log(`\nUsing the Metro server already running at ${metroStatusUrl}.\n`);
  } else {
    console.log(`\nStarting Metro at ${metroStatusUrl}...\n`);
    metro = spawn(
      expoBinary,
      // Do not force Expo's `--localhost` mode here. On current macOS/Node it
      // can bind only to IPv6 ::1 while the development client is given an
      // IPv4 127.0.0.1 URL. The normal LAN host binds on every local interface
      // and works reliably for both Simulator and a connected development
      // device.
      ['start', '--dev-client', '--port', String(metroPort)],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: ['ignore', 'inherit', 'inherit'],
      },
    );
    metro.once('error', (error) => {
      metroSpawnError = error;
    });
    await waitForMetro();
    console.log('\nMetro is ready. Building and opening the iOS Simulator app...\n');
  }

  // Ask CoreSimulator for its device list before opening Simulator. This starts
  // the service cleanly without killing Apple processes that may be in use.
  spawnSync('xcrun', ['simctl', 'list', 'devices', 'available'], { stdio: 'ignore' });
  const openSimulator = spawnSync('open', ['-a', 'Simulator'], { stdio: 'inherit' });
  if (openSimulator.status !== 0) {
    throw new Error('Apple Simulator could not be opened. Open Xcode once, then retry.');
  }

  ios = spawn(
    expoBinary,
    ['run:ios', '--no-bundler'],
    {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    },
  );

  const exitCode = await new Promise((resolve) => {
    ios.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
    ios.once('error', () => resolve(1));
  });

  if (exitCode !== 0) {
    throw new Error(`The iOS build or launch failed (exit ${exitCode}).`);
  }

  console.log('\nThe app is open and Metro is running. Press Control+C when finished.\n');

  // If this script started Metro, keep the process alive so the development
  // server remains available for reloads. If Metro was already running, exit.
  if (metro) {
    await new Promise((resolve) => metro.once('exit', resolve));
  }
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  shutdown(1);
});

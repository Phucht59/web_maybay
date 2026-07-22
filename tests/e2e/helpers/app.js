const { spawn, exec } = require('child_process');
const path = require('path');
const net = require('net');

let backendProcess = null;
let frontendProcess = null;

function isPortActive(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(1000);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, 'localhost', () => {
      socket.end();
      resolve(true);
    });
  });
}

function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    async function check() {
      if (await isPortActive(port)) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for port ${port}`));
        return;
      }
      setTimeout(check, 500);
    }
    check();
  });
}

function killProcess(proc) {
  if (!proc) return Promise.resolve();
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${proc.pid} /T /F`, () => {
        resolve();
      });
    } else {
      proc.kill('SIGKILL');
      resolve();
    }
  });
}

async function startApps() {
  const backendRunning = await isPortActive(5071);
  if (!backendRunning) {
    console.log('Starting backend ASP.NET Core API on port 5071...');
    const projectPath = path.resolve(__dirname, '../../../FlightBookingSystem.Web');
    backendProcess = spawn('dotnet', ['run', '--project', projectPath, '--launch-profile', 'http'], {
      stdio: 'ignore',
      shell: true,
      cwd: projectPath
    });
  } else {
    console.log('Backend API is already running on port 5071.');
  }

  const frontendRunning = await isPortActive(5173);
  if (!frontendRunning) {
    console.log('Starting frontend React Vite dev server on port 5173...');
    const frontendPath = path.resolve(__dirname, '../../../flight-booking-frontend');
    frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'ignore',
      shell: true,
      cwd: frontendPath
    });
  } else {
    console.log('Frontend dev server is already running on port 5173.');
  }

  console.log('Waiting for backend on port 5071 to respond...');
  await waitForPort(5071);
  console.log('Waiting for frontend on port 5173 to respond...');
  await waitForPort(5173);
  console.log('All application servers are active and responsive.');
}

async function stopApps() {
  if (backendProcess) {
    console.log('Stopping backend API...');
    await killProcess(backendProcess);
    backendProcess = null;
  }
  if (frontendProcess) {
    console.log('Stopping frontend dev server...');
    await killProcess(frontendProcess);
    frontendProcess = null;
  }
}

module.exports = {
  isPortActive,
  startApps,
  stopApps
};

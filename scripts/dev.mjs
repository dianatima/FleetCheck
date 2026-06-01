import { spawn } from 'node:child_process'
import { platform } from 'node:process'

const processes = []
let shuttingDown = false

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })

  processes.push({ name, child })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return

    if (code !== 0 && code !== null) {
      console.error(`[dev] ${name} exited with code ${code}`)
      shutdown(code)
      return
    }

    if (signal) {
      console.error(`[dev] ${name} exited with signal ${signal}`)
      shutdown(1)
    }
  })

  return child
}

function killProcessTree(pid) {
  if (!pid) return

  if (platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: true,
    })
    return
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // ignore
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const { child } of processes) {
    killProcessTree(child.pid)
  }

  setTimeout(() => process.exit(code), 300)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
process.on('exit', () => shutdown(0))

start('frontend', 'npm', ['run', 'dev:frontend'])
start('backend', 'npm', ['run', 'dev:backend'])

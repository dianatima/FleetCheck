import { spawnSync } from 'node:child_process'

function killPort(port) {
  const find = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique`,
    ],
    { encoding: 'utf8' }
  )

  if (find.status !== 0 || !find.stdout.trim()) {
    console.log(`[dev:stop] port ${port} is already free`)
    return
  }

  const pids = find.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const pid of pids) {
    const stop = spawnSync('taskkill', ['/pid', pid, '/T', '/F'], {
      encoding: 'utf8',
    })

    if (stop.status === 0) {
      console.log(`[dev:stop] killed PID ${pid} on port ${port}`)
    } else {
      console.log(`[dev:stop] failed to kill PID ${pid} on port ${port}`)
      if (stop.stdout) console.log(stop.stdout.trim())
      if (stop.stderr) console.log(stop.stderr.trim())
    }
  }
}

killPort(5173)
killPort(3000)

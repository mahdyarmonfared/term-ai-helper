/**
 * term-ai-helper - Offline Semantic Knowledge Base & Slot Engine
 * Pre-compiled deterministic rule maps for PowerShell, Bash, and CMD.
 */

const PATTERNS = [
  // --- GIT COMMANDS ---
  {
    id: 'git_undo_commit_hard',
    match: /(undo|discard|delete|reset)\s+(the\s+)?(last\s+)?commit.*(discard|delete|drop|hard)/i,
    commands: {
      bash: 'git reset --hard HEAD~1',
      pwsh: 'git reset --hard HEAD~1',
      cmd: 'git reset --hard HEAD~1'
    },
    risk: 'dangerous',
    description: 'Permanently discards the last commit and all uncommitted working directory changes.'
  },
  {
    id: 'git_undo_commit_soft',
    match: /(undo|revert|reset)\s+(the\s+)?(last\s+)?commit/i,
    commands: {
      bash: 'git reset --soft HEAD~1',
      pwsh: 'git reset --soft HEAD~1',
      cmd: 'git reset --soft HEAD~1'
    },
    risk: 'caution',
    description: 'Resets the current HEAD to the previous commit while keeping all modified files staged in index.'
  },
  {
    id: 'git_discard_all_changes',
    match: /(discard|revert|undo)\s+(all\s+)?(local\s+)?(changes|modifications|unstaged)/i,
    commands: {
      bash: 'git restore . && git clean -fd',
      pwsh: 'git restore . ; git clean -fd',
      cmd: 'git restore . && git clean -fd'
    },
    risk: 'dangerous',
    description: 'Discards all working tree modifications and permanently removes untracked files and directories.'
  },
  {
    id: 'git_create_branch',
    match: /(create|make|checkout\s+new)\s+(a\s+)?(new\s+)?branch\s+([a-zA-Z0-9_\-\/]+)/i,
    extract: (m) => ({ branch: m[4] || 'feature-branch' }),
    commands: {
      bash: (ctx) => `git checkout -b ${ctx.branch}`,
      pwsh: (ctx) => `git checkout -b ${ctx.branch}`,
      cmd: (ctx) => `git checkout -b ${ctx.branch}`
    },
    risk: 'safe',
    description: 'Creates a new Git branch and switches the current working tree to it.'
  },
  {
    id: 'git_rename_current_branch',
    match: /(rename|change)\s+(current\s+)?branch\s+(to\s+)?([a-zA-Z0-9_\-\/]+)/i,
    extract: (m) => ({ branch: m[4] }),
    commands: {
      bash: (ctx) => `git branch -m ${ctx.branch}`,
      pwsh: (ctx) => `git branch -m ${ctx.branch}`,
      cmd: (ctx) => `git branch -m ${ctx.branch}`
    },
    risk: 'caution',
    description: 'Renames the currently active local Git branch.'
  },
  {
    id: 'git_amend_last_commit_message',
    match: /(change|amend|edit|update)\s+(last\s+)?commit\s+message/i,
    commands: {
      bash: 'git commit --amend -m "Updated commit message"',
      pwsh: 'git commit --amend -m "Updated commit message"',
      cmd: 'git commit --amend -m "Updated commit message"'
    },
    risk: 'caution',
    description: 'Amends the most recent commit with a new message without creating a new commit.'
  },
  {
    id: 'git_stash_keep_index',
    match: /(stash|save)\s+(current\s+)?(uncommitted\s+)?changes/i,
    commands: {
      bash: 'git stash -u',
      pwsh: 'git stash -u',
      cmd: 'git stash -u'
    },
    risk: 'safe',
    description: 'Saves your local modifications to a stash record, including newly created untracked files.'
  },

  // --- PROCESS & PORT COMMANDS ---
  {
    id: 'kill_port',
    match: /(kill|stop|terminate|free)\s+(the\s+)?(process\s+on\s+)?port\s+([0-9]{2,5})/i,
    extract: (m) => ({ port: m[4] }),
    commands: {
      bash: (ctx) => `fuser -k ${ctx.port}/tcp || lsof -ti:${ctx.port} | xargs kill -9`,
      pwsh: (ctx) => `Stop-Process -Id (Get-NetTCPConnection -LocalPort ${ctx.port} -ErrorAction SilentlyContinue).OwningProcess -Force`,
      cmd: (ctx) => `FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :${ctx.port}') DO taskkill /F /PID %P`
    },
    risk: 'caution',
    description: 'Identifies the process holding a network port and forcefully terminates it.'
  },
  {
    id: 'find_process_on_port',
    match: /(find|check|show|which|what)\s+(process\s+is\s+)?(listening\s+on|using)\s+port\s+([0-9]{2,5})/i,
    extract: (m) => ({ port: m[4] }),
    commands: {
      bash: (ctx) => `lsof -i :${ctx.port} || netstat -tulpn | grep :${ctx.port}`,
      pwsh: (ctx) => `Get-NetTCPConnection -LocalPort ${ctx.port} | Format-Table LocalAddress,LocalPort,OwningProcess,State`,
      cmd: (ctx) => `netstat -ano | findstr :${ctx.port}`
    },
    risk: 'safe',
    description: 'Displays the PID and connection details of the application bound to the specified TCP port.'
  },
  {
    id: 'top_processes_by_memory',
    match: /(top|highest|most)\s+(memory|ram)\s+(processes|apps)/i,
    commands: {
      bash: 'ps aux --sort=-%mem | head -n 10',
      pwsh: 'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N="Memory(MB)";E={[math]::Round($_.WorkingSet64 / 1MB, 2)}}',
      cmd: 'tasklist /FI "MEMUSAGE gt 50000" /NH'
    },
    risk: 'safe',
    description: 'Lists the top 10 memory-consuming processes currently active on the host system.'
  },
  {
    id: 'kill_process_by_name',
    match: /(kill|terminate|stop)\s+(process\s+)?([a-zA-Z0-9_\-\.]+)\.exe/i,
    extract: (m) => ({ name: m[3] }),
    commands: {
      bash: (ctx) => `pkill -f ${ctx.name}`,
      pwsh: (ctx) => `Stop-Process -Name "${ctx.name}" -Force`,
      cmd: (ctx) => `taskkill /F /IM ${ctx.name}.exe`
    },
    risk: 'caution',
    description: 'Forces termination of all process instances matching the specified executable name.'
  },

  // --- FILE & DISK SEARCH ---
  {
    id: 'find_large_files',
    match: /(find|list|show)\s+(files\s+)?(larger|bigger|greater)\s+than\s+([0-9]+)\s*(mb|gb)/i,
    extract: (m) => ({ size: m[4], unit: m[5].toUpperCase() }),
    commands: {
      bash: (ctx) => `find . -type f -size +${ctx.size}${ctx.unit === 'GB' ? 'G' : 'M'} -exec ls -lh {} +`,
      pwsh: (ctx) => `Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt ${ctx.size}${ctx.unit} } | Select-Object FullName, @{N="Size";E={[math]::Round($_.Length/1${ctx.unit}, 2)}}`,
      cmd: (ctx) => `forfiles /S /M *.* /C "cmd /c if @fsize GEQ 104857600 echo @path @fsize"`
    },
    risk: 'safe',
    description: 'Scans the directory tree recursively to find files exceeding the threshold size.'
  },
  {
    id: 'find_files_modified_recently',
    match: /(find|list)\s+files\s+modified\s+in\s+(the\s+)?last\s+([0-9]+)\s+(hours|days)/i,
    extract: (m) => ({ count: m[3], unit: m[4].toLowerCase() }),
    commands: {
      bash: (ctx) => ctx.unit === 'hours' ? `find . -type f -mmin -${parseInt(ctx.count, 10) * 60}` : `find . -type f -mtime -${ctx.count}`,
      pwsh: (ctx) => `Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).Add${ctx.unit === 'hours' ? 'Hours' : 'Days'}(-${ctx.count}) }`,
      cmd: (ctx) => `forfiles /S /D +${ctx.count} /C "cmd /c echo @path @fdate @ftime"`
    },
    risk: 'safe',
    description: 'Locates files created or updated within the specified recent timeframe.'
  },
  {
    id: 'grep_text_recursive',
    match: /(find|search|grep)\s+(for\s+)?(text|string|word)?\s*["']([^"']+)["']\s*(inside|in)?\s*(files)?/i,
    extract: (m) => ({ pattern: m[4] }),
    commands: {
      bash: (ctx) => `grep -rnI "${ctx.pattern}" .`,
      pwsh: (ctx) => `Get-ChildItem -Recurse -File | Select-String -Pattern "${ctx.pattern}"`,
      cmd: (ctx) => `findstr /S /I /N "${ctx.pattern}" *.*`
    },
    risk: 'safe',
    description: 'Recursively searches through file contents for occurrences of the specified text pattern.'
  },
  {
    id: 'disk_free_space',
    match: /(check|view|show|display)\s+(disk|drive)\s+(free\s+space|usage|capacity)/i,
    commands: {
      bash: 'df -h',
      pwsh: 'Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N="Used(GB)";E={[math]::Round($_.Used/1GB, 2)}}, @{N="Free(GB)";E={[math]::Round($_.Free/1GB, 2)}}',
      cmd: 'wmic logicaldisk get caption, freespace, size'
    },
    risk: 'safe',
    description: 'Displays partition storage capacity, used space, and available free space in human-readable units.'
  },

  // --- DOCKER CONTAINERS ---
  {
    id: 'docker_remove_stopped_containers',
    match: /(delete|remove|clean|prune)\s+(all\s+)?stopped\s+containers/i,
    commands: {
      bash: 'docker container prune -f',
      pwsh: 'docker container prune -f',
      cmd: 'docker container prune -f'
    },
    risk: 'caution',
    description: 'Removes all stopped Docker containers to reclaim system resources.'
  },
  {
    id: 'docker_remove_dangling_images',
    match: /(delete|remove|clean|prune)\s+(all\s+)?(dangling|unused)\s+images/i,
    commands: {
      bash: 'docker image prune -a -f',
      pwsh: 'docker image prune -a -f',
      cmd: 'docker image prune -a -f'
    },
    risk: 'caution',
    description: 'Deletes all unreferenced and untagged Docker images.'
  },
  {
    id: 'docker_container_logs_tail',
    match: /(view|follow|tail)\s+logs\s+(of|for)\s+([a-zA-Z0-9_\-]+)/i,
    extract: (m) => ({ name: m[3] }),
    commands: {
      bash: (ctx) => `docker logs -f --tail 100 ${ctx.name}`,
      pwsh: (ctx) => `docker logs -f --tail 100 ${ctx.name}`,
      cmd: (ctx) => `docker logs -f --tail 100 ${ctx.name}`
    },
    risk: 'safe',
    description: 'Streams the last 100 log lines from the container and stays attached to future output.'
  },

  // --- ARCHIVE & COMPRESSION ---
  {
    id: 'compress_tar_gz',
    match: /(compress|tar|archive)\s+(folder|directory)\s+([a-zA-Z0-9_\-\.]+)\s+to\s+([a-zA-Z0-9_\-\.]+)\.tar\.gz/i,
    extract: (m) => ({ source: m[3], target: m[4] }),
    commands: {
      bash: (ctx) => `tar -czvf ${ctx.target}.tar.gz ${ctx.source}`,
      pwsh: (ctx) => `tar -czvf ${ctx.target}.tar.gz ${ctx.source}`,
      cmd: (ctx) => `tar -czvf ${ctx.target}.tar.gz ${ctx.source}`
    },
    risk: 'safe',
    description: 'Creates a gzip-compressed tarball archive of the target directory.'
  },
  {
    id: 'compress_zip',
    match: /(zip|compress)\s+(folder|directory)\s+([a-zA-Z0-9_\-\.]+)\s+to\s+([a-zA-Z0-9_\-\.]+)\.zip/i,
    extract: (m) => ({ source: m[3], target: m[4] }),
    commands: {
      bash: (ctx) => `zip -r ${ctx.target}.zip ${ctx.source}`,
      pwsh: (ctx) => `Compress-Archive -Path "${ctx.source}" -DestinationPath "${ctx.target}.zip" -Force`,
      cmd: (ctx) => `tar -a -c -f ${ctx.target}.zip ${ctx.source}`
    },
    risk: 'safe',
    description: 'Compacts the selected directory into a standard .zip archive file.'
  },

  // --- NETWORK & DIAGNOSTICS ---
  {
    id: 'check_external_ip',
    match: /(what\s+is\s+my|get|show|check)\s+(public|external|wan)\s+ip/i,
    commands: {
      bash: 'curl -s https://icanhazip.com || curl -s https://ifconfig.me',
      pwsh: '(Invoke-RestMethod -Uri "https://icanhazip.com").Trim()',
      cmd: 'curl -s https://icanhazip.com'
    },
    risk: 'safe',
    description: 'Queries an external HTTP service to obtain the public WAN IP of your gateway.'
  },
  {
    id: 'check_ssl_cert_expiry',
    match: /(check|view|show)\s+(ssl|tls)\s+cert(ificate)?\s+(expiry|expiration)\s+(for|of)\s+([a-zA-Z0-9\.\-]+)/i,
    extract: (m) => ({ domain: m[6] }),
    commands: {
      bash: (ctx) => `echo | openssl s_client -servername ${ctx.domain} -connect ${ctx.domain}:443 2>/dev/null | openssl x509 -noout -dates`,
      pwsh: (ctx) => `[Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}; $req = [Net.HttpWebRequest]::Create("https://${ctx.domain}"); $req.GetResponse().Dispose(); $req.ServicePoint.Certificate.GetExpirationDateString()`,
      cmd: (ctx) => `curl --insecure -v https://${ctx.domain} 2>&1 | findstr /I "expire"`
    },
    risk: 'safe',
    description: 'Performs TLS handshake with domain on port 443 and outputs the SSL certificate validity dates.'
  }
];

module.exports = {
  PATTERNS
};

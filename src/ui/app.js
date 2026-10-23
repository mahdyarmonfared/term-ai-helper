// Term-AI Studio Frontend Application

let currentShell = 'pwsh';

const queryInput = document.getElementById('queryInput');
const synthBtn = document.getElementById('synthBtn');
const chipsContainer = document.getElementById('chipsContainer');
const shellSelector = document.getElementById('shellSelector');
const currentShellTitle = document.getElementById('currentShellTitle');

const codeOutput = document.getElementById('codeOutput');
const riskBadge = document.getElementById('riskBadge');
const cmdDescription = document.getElementById('cmdDescription');
const copyBtn = document.getElementById('copyBtn');

const altPwsh = document.getElementById('altPwsh');
const altBash = document.getElementById('altBash');
const altCmd = document.getElementById('altCmd');
const breakdownList = document.getElementById('breakdownList');
const toast = document.getElementById('toast');

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Shell Switching
shellSelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.shell-btn');
  if (!btn) return;
  document.querySelectorAll('.shell-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentShell = btn.dataset.shell;
  currentShellTitle.textContent = btn.textContent;
  if (queryInput.value.trim()) {
    synthesize();
  }
});

async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    if (data.templates && chipsContainer) {
      chipsContainer.innerHTML = '';
      data.templates.forEach(t => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = t.label;
        chip.addEventListener('click', () => {
          queryInput.value = t.query;
          synthesize();
        });
        chipsContainer.appendChild(chip);
      });
    }
  } catch (err) {
    console.error('Failed to load templates:', err);
  }
}

async function synthesize() {
  const query = queryInput.value.trim();
  if (!query) return;

  codeOutput.textContent = '# Synthesizing command...';
  cmdDescription.textContent = 'Analyzing intent and generating shell syntax...';

  try {
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, shell: currentShell })
    });

    const data = await res.json();

    if (!data.success) {
      codeOutput.textContent = `# Error: ${data.error}`;
      cmdDescription.textContent = 'Please try rephrasing your request.';
      riskBadge.className = 'risk-badge caution';
      riskBadge.textContent = 'UNKNOWN';
      breakdownList.innerHTML = '<div class="empty-state">No tokens available for unresolved query.</div>';
      return;
    }

    // Update Primary Command
    codeOutput.textContent = data.command;
    cmdDescription.textContent = data.description || 'Command generated successfully.';

    // Update Risk Badge
    riskBadge.className = `risk-badge ${data.risk.level}`;
    riskBadge.textContent = data.risk.level.toUpperCase();
    riskBadge.title = data.risk.reason;

    // Update Alternatives
    if (data.alternatives) {
      altPwsh.textContent = data.alternatives.pwsh || '-';
      altBash.textContent = data.alternatives.bash || '-';
      altCmd.textContent = data.alternatives.cmd || '-';
    }

    // Update Token Breakdown
    if (data.breakdown && data.breakdown.length > 0) {
      breakdownList.innerHTML = '';
      data.breakdown.forEach(item => {
        const row = document.createElement('div');
        row.className = 'token-row';
        row.innerHTML = `
          <span class="token-name">${escapeHtml(item.token)}</span>
          <span class="token-type-pill">${item.type}</span>
          <span class="token-desc">${escapeHtml(item.explanation)}</span>
        `;
        breakdownList.appendChild(row);
      });
    } else {
      breakdownList.innerHTML = '<div class="empty-state">No special flags present in this command.</div>';
    }
  } catch (err) {
    codeOutput.textContent = `# Network or Server Error: ${err.message}`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Event Listeners
synthBtn.addEventListener('click', synthesize);
queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    synthesize();
  }
});

copyBtn.addEventListener('click', async () => {
  const cmd = codeOutput.textContent.trim();
  if (!cmd || cmd.startsWith('#')) return;
  try {
    await navigator.clipboard.writeText(cmd);
    showToast('Command copied to clipboard!');
  } catch {
    const el = document.createElement('textarea');
    el.value = cmd;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Command copied to clipboard!');
  }
});

// Initialization
loadTemplates();
queryInput.value = 'kill process on port 3000';
synthesize();

const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

function findBrowserPath() {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  if (process.env.LOCALAPPDATA) {
    paths.push(path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'));
  }

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  try {
    const whereEdge = execFileSync('where', ['msedge'], { encoding: 'utf8' }).trim().split('\n')[0].trim();
    if (fs.existsSync(whereEdge)) return whereEdge;
  } catch (e) {}

  try {
    const whereChrome = execFileSync('where', ['chrome'], { encoding: 'utf8' }).trim().split('\n')[0].trim();
    if (fs.existsSync(whereChrome)) return whereChrome;
  } catch (e) {}

  throw new Error('Could not find Google Chrome or Microsoft Edge. Please install one of them.');
}

function loadPage(url) {
  const browserPath = findBrowserPath();
  return new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=2000',
      '--dump-dom',
      url
    ];

    execFile(browserPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function assertContainsText(html, text) {
  if (!html.includes(text)) {
    throw new Error(`DOM does not contain the expected text: "${text}"`);
  }
}

function assertHasElement(html, selector) {
  if (selector.startsWith('.')) {
    const className = selector.slice(1);
    const regex = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`);
    if (!regex.test(html)) {
      throw new Error(`DOM does not contain an element with class: "${className}"`);
    }
  } else if (selector.startsWith('#')) {
    const idName = selector.slice(1);
    const regex = new RegExp(`id="${idName}"`);
    if (!regex.test(html)) {
      throw new Error(`DOM does not contain an element with id: "${idName}"`);
    }
  } else {
    const regex = new RegExp(`<${selector}\\b[^>]*>`);
    if (!regex.test(html)) {
      throw new Error(`DOM does not contain an element with tag: "${selector}"`);
    }
  }
}

function extractText(html, selector) {
  if (selector.startsWith('.')) {
    const className = selector.slice(1);
    const regex = new RegExp(`<\\w+[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\w+>`, 'i');
    const match = regex.exec(html);
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
  } else if (selector.startsWith('#')) {
    const idName = selector.slice(1);
    const regex = new RegExp(`<\\w+[^>]*id="${idName}"[^>]*>([\\s\\S]*?)<\\/\\w+>`, 'i');
    const match = regex.exec(html);
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
  } else {
    const regex = new RegExp(`<${selector}\\b[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
    const match = regex.exec(html);
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
  }
}

module.exports = {
  loadPage,
  assertContainsText,
  assertHasElement,
  extractText
};

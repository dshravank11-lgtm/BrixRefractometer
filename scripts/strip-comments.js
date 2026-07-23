
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const strip = require('strip-comments');


const ROOT = path.resolve(__dirname, '..');


const patterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];

function processFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const stripped = strip(code);
    if (stripped !== code) {
      fs.writeFileSync(filePath, stripped, 'utf8');
      console.log(`Stripped comments: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: ROOT, absolute: true, ignore: ['node_modules/**', 'dist/**'] });
  files.forEach(processFile);
});

console.log('Comment stripping completed.');

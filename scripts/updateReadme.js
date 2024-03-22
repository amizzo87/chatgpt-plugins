const fs = require('fs');
const path = require('path');

let testResults;
const testResultsPath = path.join(__dirname, '..', 'test-results.json');

try {
  testResults = require(testResultsPath);
} catch (error) {
  console.error('Failed to load test results:', error);
  process.exit(1);
}

const updateReadmeForTestResults = (results) => {
  const readmePath = path.join(__dirname, '../', 'README.md');
  let readmeContents;
  
  try {
    readmeContents = fs.readFileSync(readmePath, 'utf8');
  } catch (error) {
    console.error('Failed to read README.md:', error);
    return;
  }

  const lines = readmeContents.split('\n');
  let updated = false;

  results.testResults.forEach(test => {
    const manifestName = path.basename(test.name, '.json');
    const passed = test.status === "passed";
    const statusIcon = passed ? '✓' : '✗';

    const lineIndex = lines.findIndex(line => line.includes(manifestName));
    if (lineIndex !== -1) {
      updated = true;
      const parts = lines[lineIndex].split('|');
      parts[parts.length - 2] = ` ${statusIcon} `;
      lines[lineIndex] = parts.join('|');
    }
  });

  if (updated) {
    try {
      fs.writeFileSync(readmePath, lines.join('\n'));
      console.log('README.md updated successfully.');
    } catch (error) {
      console.error('Failed to write README.md:', error);
    }
  } else {
    console.log('No updates made to README.md.');
  }
};

updateReadmeForTestResults(testResults);

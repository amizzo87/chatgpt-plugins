const fs = require('fs');
const path = require('path');
const testResultsPath = path.join(__dirname, '..', 'test-results.json');
const testResults = require(testResultsPath);

const updateReadmeForTestResults = (results) => {
  const readmePath = path.join(__dirname, '../', 'README.md');
  let readmeContents = fs.readFileSync(readmePath, 'utf8');
  const lines = readmeContents.split('\n');

  results.testResults.forEach(test => {
    const manifestName = path.basename(test.name, '.json');
    const passed = test.status === "passed"; // Adjust according to your jest results structure
    const statusIcon = passed ? '&check;' : '&cross;';

    const lineIndex = lines.findIndex(line => line.includes(manifestName));
    if (lineIndex !== -1) {
      const parts = lines[lineIndex].split('|');
      parts[parts.length - 2] = ` ${statusIcon} `;
      lines[lineIndex] = parts.join('|');
    }
  });

  readmeContents = lines.join('\n');
  fs.writeFileSync(readmePath, readmeContents);
};

updateReadmeForTestResults(testResults);

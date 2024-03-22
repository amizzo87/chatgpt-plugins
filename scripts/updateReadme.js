const fs = require('fs');
const path = require('path');

// Load test results
const testResultsPath = path.join(__dirname, 'test-results.json');
const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));

// Load README content
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Ensure the "Passed Unit Tests?" column exists
if (!readmeContent.includes('|Passed Unit Tests?|')) {
  // Add the column header if it's missing
  readmeContent = readmeContent.replace(
    '|Access w/o Authentication?|',
    '|Access w/o Authentication?|Passed Unit Tests?|'
  );
}

// Update or add the test results in the README
readmeContent = readmeContent.split('\n').map(line => {
  // Identify lines that are part of the table (excluding the header and separator)
  if (line.startsWith('|') && !line.includes('---') && line.includes('|[A ')) {
    const pluginNameMatch = line.match(/\|\[([^\]]+)\]/);
    if (pluginNameMatch) {
      const pluginName = pluginNameMatch[1];
      const testPassed = testResults[`${pluginName}.json`];
      const statusIcon = testPassed ? '&check;' : '&cross;';

      // Check if the line already has a test result
      if (line.endsWith('|')) {
        // Line already has a cell for test results, update it
        return line.replace(/\|&check;\||\|&cross;\|$/, `|${statusIcon}|`);
      } else {
        // Add the test result
        return `${line}${statusIcon}|`;
      }
    }
  }
  return line;
}).join('\n');

// Write the updated README back to disk
fs.writeFileSync(readmePath, readmeContent);

console.log('README.md has been updated with test results.');

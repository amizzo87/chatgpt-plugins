const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
const readmePath = path.join(__dirname, '..', 'README.md');
const tableStartMarker = '<!-- START TABLE @HERE -->';

async function updateReadmeForTestResults(results) {
  try {
    const testResults = require(testResultsPath);
    if (!testResults || !Array.isArray(testResults.testResults)) {
      throw new Error('Invalid test results format');
    }

    let readmeContents = await fs.promises.readFile(readmePath, 'utf8');

    const lines = readmeContents.split('\n');
    const tableStartIndex = lines.findIndex(line => line.includes(tableStartMarker));
    if (tableStartIndex === -1) {
      console.error(`Table start marker not found in README.md: ${tableStartMarker}`);
      return;
    }

    // Add header if it does not exist
    const headerIndex = tableStartIndex + 1;
    if (!lines[headerIndex].includes('Manifest|Passed?')) {
      lines[headerIndex] = 'Manifest|Passed?';
      lines[headerIndex + 1] = ':---:|:---:';
    }

    let updated = false;

    for (const test of testResults.testResults) {
      const manifestName = path.basename(test.name, '.json');
      const passed = test.status === "passed";
      const statusIcon = passed ? '&check;' : '&cross;';

      const lineIndex = lines.findIndex(line => line.includes(manifestName) && line.startsWith('|'));
      if (lineIndex !== -1) {
        updated = true;
        const parts = lines[lineIndex].split('|');
        parts[parts.length - 1] = ` ${statusIcon} |`; // Update or add the test result icon
        lines[lineIndex] = parts.join('|');
      }
    }

    if (updated) {
      readmeContents = lines.join('\n');
      await fs.promises.writeFile(readmePath, readmeContents);
      console.log('README.md updated successfully.');
    } else {
      console.log('No updates made to README.md.');
    }
  } catch (error) {
    console.error('Failed to update README.md:', error);
  }
}

updateReadmeForTestResults();

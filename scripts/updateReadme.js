const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let data = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));

const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContents = fs.readFileSync(readmePath, 'utf8');
let lines = readmeContents.split('\n');

// Locate the table start marker and ensure the "Passed Unit Tests?" column exists
const tableStartMarker = "<!-- START TABLE @HERE -->";
const tableStartIndex = lines.findIndex(line => line.includes(tableStartMarker));
if (tableStartIndex === -1) {
    console.error('Table start marker not found in README.md.');
    process.exit(1);
}

const headerIndex = tableStartIndex + 1;
if (!lines[headerIndex].includes('Passed Unit Tests?')) {
    lines[headerIndex] += 'Passed Unit Tests?|';
    lines[headerIndex + 1] += ':---:|'; // Assuming the next line is the separator
    // Prepare existing rows with an additional column
    for (let i = headerIndex + 2; i < lines.length && lines[i].startsWith('|'); i++) {
        lines[i] += ' |';
    }
}

// Update each row with the test results
data.testResults.forEach(testSuite => {
    const manifestName = testSuite.name.split('/').pop(); // Extracting file name
    // Determine the overall outcome for the manifest
    const allPassed = testSuite.assertionResults.every(test => test.status === "passed");
    const statusIcon = allPassed ? '&check;' : '&cross;';

    const rowToUpdateIndex = lines.findIndex(line => line.includes(`[${manifestName}]`));
    if (rowToUpdateIndex !== -1) {
        let parts = lines[rowToUpdateIndex].split('|');
        parts[parts.length - 2] = ` ${statusIcon} `;
        lines[rowToUpdateIndex] = parts.join('|');
    }
});

// Write the updated contents back to README.md
fs.writeFileSync(readmePath, lines.join('\n'));
console.log('README.md has been successfully updated.');
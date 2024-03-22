const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let testResults;

try {
    testResults = require(testResultsPath);
} catch (error) {
    console.error('Failed to load test results:', error);
    process.exit(1);
}

const updateReadmeForTestResults = (results) => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContents;

    try {
        readmeContents = fs.readFileSync(readmePath, 'utf8');
    } catch (error) {
        console.error('Failed to read README.md:', error);
        return;
    }

    const lines = readmeContents.split('\n');
    const tableStartIndex = lines.findIndex(line => line.includes('<!-- START TABLE @HERE -->'));
    if (tableStartIndex === -1) {
        console.error('Table start marker not found in README.md.');
        return;
    }

    // Assuming the header is the next line after the marker, and the separator is the line after the header
    const headerIndex = tableStartIndex + 1;
    const separatorIndex = headerIndex + 1;

    // Ensure the "Passed Unit Tests?" column exists
    if (!lines[headerIndex].includes('Passed Unit Tests?')) {
        lines[headerIndex] = lines[headerIndex].trim() + '|Passed Unit Tests?';
        lines[separatorIndex] = lines[separatorIndex].trim() + '|:---:';
    }

    let updated = false;

    results.testResults.forEach(test => {
        const manifestName = path.basename(test.name, '.json');
        const passed = test.status === "passed";
        const statusIcon = passed ? '&check;' : '&cross;';

        const lineIndex = lines.findIndex(line => line.includes(manifestName) && line.startsWith('|'));
        if (lineIndex !== -1) {
            updated = true;
            let parts = lines[lineIndex].split('|');
            parts[parts.length - 1] = ` ${statusIcon} |`; // Update or add the test result icon
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

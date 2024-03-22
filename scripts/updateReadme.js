const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let testResults;

try {
    testResults = require(testResultsPath);
} catch (error) {
    console.error('Error loading test results:', error.message);
    process.exit(1);
}

const updateReadmeForTestResults = (results) => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContents;

    try {
        readmeContents = fs.readFileSync(readmePath, 'utf8');
    } catch (error) {
        console.error('Error reading README.md:', error.message);
        return;
    }

    let lines;
    try {
        lines = readmeContents.split('\n');
    } catch (error) {
        console.error('Error splitting README.md contents:', error.message);
        return;
    }

    const tableStartIndex = lines.findIndex(line => line.includes('<!-- START TABLE @HERE -->'));
    if (tableStartIndex === -1) {
        console.error('Table start marker not found in README.md.');
        return;
    }

    const headerIndex = tableStartIndex + 1;
    const separatorIndex = headerIndex + 1;

    if (!lines[headerIndex] || !lines[separatorIndex]) {
        console.error('Table header or separator not found in README.md.');
        return;
    }

    if (!lines[headerIndex].includes('Passed Unit Tests?')) {
        lines[headerIndex] += '|Passed Unit Tests?';
        lines[separatorIndex] += '|:---:';
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
            parts[parts.length - 1] = ` ${statusIcon} |`;
            lines[lineIndex] = parts.join('|');
        }
    });

    if (updated) {
        try {
            fs.writeFileSync(readmePath, lines.join('\n'));
            console.log('README.md updated successfully.');
        } catch (error) {
            console.error('Error writing README.md:', error.message);
        }
    } else {
        console.log('No updates made to README.md. Ensure test results contain correct manifest names.');
    }
};

try {
    updateReadmeForTestResults(testResults);
} catch (error) {
    console.error('An unexpected error occurred:', error.message);
}

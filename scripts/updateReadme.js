const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let data;
try {
    data = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
} catch (error) {
    console.error(`Error reading test results from ${testResultsPath}:`, error);
    process.exit(1);
}

const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContents;
try {
    readmeContents = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
    console.error(`Error reading README.md from ${readmePath}:`, error);
    process.exit(1);
}
let lines = readmeContents.split('\n');

const updateReadme = () => {
    const tableStartIndex = lines.findIndex(line => line.includes('<!-- START TABLE @HERE -->'));
    if (tableStartIndex === -1) {
        console.error('Table start marker not found in README.md.');
        return;
    }

    // Assuming the last line of the file is where new rows should be added if not found
    let lastRowIndex = lines.length - 1; 

    data.testResults.forEach(testSuite => {
        const manifestFilename = testSuite.assertionResults[0].ancestorTitles[1];
        const passed = testSuite.status === "passed";
        const statusIcon = passed ? '&check;' : (testSuite.status === "failed" ? '&cross;' : '-');

        const rowToUpdateIndex = lines.findIndex(line => line.includes(manifestFilename));
        
        if (rowToUpdateIndex !== -1) {
            let parts = lines[rowToUpdateIndex].split('|');
            parts[parts.length - 2] = ` ${statusIcon} `;
            lines[rowToUpdateIndex] = parts.join('|');
        } else {
            // If the row for the manifest is not found, add a new row with a dash mark
            console.log(`Could not find row for ${manifestFilename} in README.md. Adding a new row.`);
            const newRow = `| |[${manifestFilename}](manifests/${manifestFilename})| | | - |`;
            lines.splice(lastRowIndex, 0, newRow); // Insert the new row before the last line
            lastRowIndex++; // Adjust the index for the next potential insert
        }
    });

    try {
        fs.writeFileSync(readmePath, lines.join('\n'));
        console.log('README.md has been successfully updated.');
    } catch (error) {
        console.error('Error writing updates to README.md:', error);
    }
};

updateReadme();

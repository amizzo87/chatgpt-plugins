const updateReadmeForTestResults = (results) => {
  const readmePath = path.join(__dirname, '../', 'README.md');
  let readmeContents;

  try {
    readmeContents = fs.readFileSync(readmePath, 'utf8');
  } catch (error) {
    console.error('Failed to read README.md:', error);
    return;
  }

  let lines = readmeContents.split('\n');
  let headerIndex = lines.findIndex(line => line.includes('|Name|')); // Identify the header row based on a unique column name
  let separatorIndex = headerIndex + 1; // The separator line is typically right after the header

  // Ensure header and separator lines exist
  if (headerIndex !== -1 && separatorIndex < lines.length) {
    // Check if "Passed Unit Tests?" column is missing and add it
    if (!lines[headerIndex].includes('|Passed Unit Tests?|')) {
      lines[headerIndex] = lines[headerIndex].trim() + '|Passed Unit Tests?|';
      lines[separatorIndex] = lines[separatorIndex].trim() + '|:-------------:|'; // Adjust alignment as needed
    }
  } else {
    console.error('Could not find table header in README.md.');
    return;
  }

  let updated = false;

  results.testResults.forEach(test => {
    const manifestName = path.basename(test.name, '.json');
    const passed = test.status === "passed";
    const statusIcon = passed ? '✓' : '✗';

    const lineIndex = lines.findIndex(line => line.includes(manifestName));
    if (lineIndex !== -1) {
      updated = true;
      let parts = lines[lineIndex].split('|');
      if (parts.length - 1 < lines[headerIndex].split('|').length - 1) {
        // If the current line has fewer columns than the header, add an empty column
        parts.splice(parts.length - 1, 0, ' ');
      }
      parts[parts.length - 2] = ` ${statusIcon} `; // Update or add the test result icon
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

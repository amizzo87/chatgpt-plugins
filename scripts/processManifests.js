const fs = require('fs');
const path = require('path');

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


const manifestsFolder = path.join('..', 'manifests');
const combinedManifests = [];
const outputFolder = path.join('..', 'lobechat');
const outputManifestsFolder = path.join(outputFolder, 'manifests');

// Ensure output directories exist
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}
if (!fs.existsSync(outputManifestsFolder)) {
  fs.mkdirSync(outputManifestsFolder, { recursive: true });
}

async function generateTags(description) {
  try {
    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `Generate three descriptive yet succinct one-word tags for a plugin based on the following description: ${description}`,
      max_tokens: 60,
      n: 1,
      temperature: 0.7,
    });
    const extractTags = (text) => {
      // Flatten the text by replacing newline characters with commas
      const flattenedText = text.replace(/\n+/g, ', ');
      
      // Split the flattened text by commas, then trim, clean, and format each tag
      const tags = flattenedText
        .split(/,\s*/)
        .map(tag => tag
          .trim() // Trim whitespace
          .replace(/^\d+\.\s*/, '') // Remove leading order numbers and periods
          .replace(/^-+\s*/, '') // Remove leading dashes
          .replace(/^"|"$/g, '') // Remove leading and trailing quotes
          .toLowerCase() // Convert to lowercase
        )
        .filter(tag => tag !== '') // Filter out any empty strings
        .slice(0, 3); // Limit to three tags
      
      return tags;
    };
    
    // Extracting the text from the response
    const textValues = response.choices[0].text;
    // Flatten all text into a single string
    const flattenedText = textValues.replace(/\n+/g, ', ');
    // Extract tags
    const tags = extractTags(flattenedText);
    
    console.log(JSON.stringify(tags));
    
    return tags;
  } catch (error) {
    console.error(`Error generating tags: ${error}`);
    return ["tag1", "tag2", "tag3"];
  }
}
async function processManifests() {
  fs.readdir(manifestsFolder, async (err, files) => {
    if (err) {
      console.error(`Error reading the directory: ${err}`);
      return;
    }

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filepath = path.join(manifestsFolder, file);
        fs.readFile(filepath, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file: ${err}`);
            return;
          }
          
          const manifest = JSON.parse(data);
          const descriptionForHuman = manifest.description_for_human || "";
          const tags = await generateTags(descriptionForHuman);

          const transformedManifest = {
            author: manifest.contact_email || "",
            createdAt: new Date().toISOString().split('T')[0],
            homepage: manifest.auth?.client_url || "",
            identifier: manifest.name_for_model || "",
            manifest: manifest.api?.url || "",
            meta: {
              avatar: manifest.logo_url || "",
              description: descriptionForHuman,
              tags: tags,
              title: manifest.name_for_human || "",
            },
            schemaVersion: (manifest.schema_version || "1").replace(/\D/g, ''),
          };

          combinedManifests.push(transformedManifest);

          // Write individual transformed manifest
          const individualOutputPath = path.join(outputManifestsFolder, `${transformedManifest.identifier}.json`);
          fs.writeFile(individualOutputPath, JSON.stringify(transformedManifest, null, 2), 'utf8', (err) => {
            if (err) {
              console.error(`Error writing individual transformed manifest: ${err}`);
            }
          });

          // Sort the combinedManifests array based on the "identifier" field
          combinedManifests.sort((a, b) => a.identifier.localeCompare(b.identifier));

          // if (combinedManifests.length === files.length) {
            // Write combined manifests
            const combinedOutputPath = path.join(outputFolder, 'combined.json');
            fs.writeFile(combinedOutputPath, JSON.stringify({ schemaVersion: 1, plugins: combinedManifests }, null, 2), 'utf8', (err) => {
              if (err) {
                console.error(`Error writing combined manifest: ${err}`);
                return;
              }
              // console.log('Combined manifest created successfully.');
            });
          // }
        });
      }
    }
  });
}

processManifests();

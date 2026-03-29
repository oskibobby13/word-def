#!/usr/bin/env node

const https = require('https');

const word = process.argv[2];

if (!word) {
  console.error('Usage: word-def <word>');
  console.error('Example: word-def hello');
  process.exit(1);
}

const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      
      if (res.statusCode === 404) {
        console.log(`❌ No definition found for "${word}"`);
        process.exit(1);
      }

      const entry = parsed[0];
      console.log(`\n📖 ${entry.word}\n`);

      entry.meanings.forEach((meaning, i) => {
        console.log(`[${meaning.partOfSpeech}]`);
        meaning.definitions.slice(0, 3).forEach((def, j) => {
          console.log(`  ${j + 1}. ${def.definition}`);
          if (def.example) {
            console.log(`     → "${def.example}"`);
          }
        });
        console.log('');
      });

    } catch (e) {
      console.log(`❌ Error parsing response for "${word}"`);
      process.exit(1);
    }
  });
}).on('error', () => {
  console.log('❌ Network error - check your connection');
  process.exit(1);
});
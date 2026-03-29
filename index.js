#!/usr/bin/env node

const https = require('https');

// Language code to name mapping
const languages = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ar: 'Arabic',
  cs: 'Czech',
  el: 'Greek',
  he: 'Hebrew',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  sv: 'Swedish',
  uk: 'Ukrainian',
  zh: 'Chinese'
};

const args = process.argv.slice(2);
let word = '';
let lang = 'en';

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-l' || args[i] === '--lang') {
    lang = args[i + 1] || 'en';
    i++;
  } else if (args[i] === '-h' || args[i] === '--help') {
    showHelp();
    process.exit(0);
  } else {
    word = args[i];
  }
}

if (!word) {
  console.error('Usage: word-def <word> [--lang <code>]');
  console.error('Example: word-def hello --lang es');
  console.error('\nSupported languages:');
  Object.entries(languages).forEach(([code, name]) => {
    console.log(`  ${code} - ${name}`);
  });
  process.exit(1);
}

const langName = languages[lang] || lang;
const url = `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      
      if (res.statusCode === 404) {
        console.log(`❌ No definition found for "${word}" (${langName})`);
        process.exit(1);
      }

      const entry = parsed[0];
      console.log(`\n📖 ${entry.word} (${langName})\n`);

      entry.meanings.forEach((meaning) => {
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

function showHelp() {
  console.log(`
📖 word-def - Dictionary CLI tool

Usage:
  word-def <word> [options]

Options:
  -l, --lang <code>  Language code (default: en)
  -h, --help        Show this help message

Examples:
  word-def hello              # English (default)
  word-def hello --lang es    # Spanish
  word-def bonjour --lang fr  # French
  word-def hola --lang es     # Spanish

Supported languages:
${Object.entries(languages).map(([c, n]) => `  ${c} - ${n}`).join('\n')}
`);
}
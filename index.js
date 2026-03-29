#!/usr/bin/env node

const https = require('https');

// Wiktionary API covers many languages
const wiktionaryLanguages = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  cs: 'Czech',
  el: 'Greek',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
  tr: 'Turkish',
  uk: 'Ukrainian'
};

const args = process.argv.slice(2);
let word = '';
let lang = 'en';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-l' || args[i] === '--lang' || args[i] === '-language') {
    lang = args[i + 1] || 'en';
    i++;
  } else if (args[i] === '-h' || args[i] === '-help' || args[i] === '--h' || args[i] === '--help') {
    showHelp();
    process.exit(0);
  } else {
    word = args[i];
  }
}

if (!word) {
  showHelp();
  process.exit(1);
}

// Make search case-insensitive - try original first, then lowercase
const searchWord = word.toLowerCase();
const originalWord = word;

const langName = wiktionaryLanguages[lang] || lang;
fetchFromWiktionary(originalWord, searchWord, lang);

function fetchFromWiktionary(originalWord, lowerWord, targetLang) {
  // For German and other languages with capitalized nouns
  // try original case first, then capitalized first letter, then lowercase
  const wordsToTry = [originalWord];
  
  // If original is lowercase, try capitalized (for German nouns)
  if (originalWord === originalWord.toLowerCase() && originalWord.length > 1) {
    wordsToTry.push(originalWord.charAt(0).toUpperCase() + originalWord.slice(1));
  }
  // If original is different from lowercase, try lowercase
  if (originalWord.toLowerCase() !== originalWord) {
    wordsToTry.push(originalWord.toLowerCase());
  }
  
  // Try the language-specific Wiktionary first
  const langCodes = [
    targetLang,
    targetLang === 'en' ? null : 'en' // fallback to English
  ];

  let wordIndex = 0;
  let langIndex = 0;
  let retries = 0;
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  function tryNext() {
    // Try next language
    while (langIndex < langCodes.length) {
      const currentLang = langCodes[langIndex];
      if (!currentLang) {
        langIndex++;
        continue;
      }

      const currentWord = wordsToTry[wordIndex];
      const hostname = currentLang === 'en' ? 'en.wiktionary.org' : `${currentLang}.wiktionary.org`;
      const path = `/api/rest_v1/page/definition/${encodeURIComponent(currentWord)}`;

      const options = {
        hostname,
        path,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'word-def-cli/1.1'
        }
      };

      const req = https.get(options, (res) => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Rate limited - retry after delay
          if (res.statusCode === 429 && retries < MAX_RETRIES) {
            retries++;
            setTimeout(tryNext, RETRY_DELAY * retries);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            
            // Check if we got an error response
            if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
              langIndex++;
              retries = 0;
              tryNext();
              return;
            }

            // Find definitions in the target language
            const targetDefs = parsed[targetLang];
            const fallbackDefs = parsed['en'];
            const definitions = targetDefs || fallbackDefs;

            if (!definitions || definitions.length === 0) {
              // Move to next language
              langIndex++;
              retries = 0;
              tryNext();
              return;
            }

            // Success! Display and exit
            displayDefinitions(currentWord, targetLang, definitions, parsed);

          } catch (e) {
            // Move to next language
            langIndex++;
            retries = 0;
            tryNext();
          }
        });
      });

      req.on('error', () => {
        // Network error - try next language
        langIndex++;
        retries = 0;
        tryNext();
      });

      return; // Wait for response
    }

    // Tried all languages for current word, try next word
    wordIndex++;
    langIndex = 0;
    retries = 0;
    
    if (wordIndex < wordsToTry.length) {
      tryNext();
    } else {
      // Exhausted all options
      console.log(`❌ No definition found for "${originalWord}" (${langName})`);
      process.exit(1);
    }
  }

  tryNext();
}

function displayDefinitions(word, lang, definitions, fullData) {
  const langName = wiktionaryLanguages[lang] || lang;
  console.log(`\n📖 ${word} (${langName})\n`);

  definitions.forEach((def, i) => {
    const partOfSpeech = def.partOfSpeech || 'word';
    console.log(`[${partOfSpeech}]`);
    
    def.definitions.slice(0, 3).forEach((d, j) => {
      // Clean HTML tags from definition
      let defText = d.definition || d;
      defText = defText.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      console.log(`  ${j + 1}. ${defText}`);
      
      if (d.example) {
        let example = d.example;
        example = example.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        console.log(`     → "${example}"`);
      }
    });
    console.log('');
  });

  // Show available languages in this entry
  const availableLangs = Object.keys(fullData).filter(k => 
    k !== 'extensions' && k !== 'type' && fullData[k]?.length > 0
  );
  if (availableLangs.length > 1) {
    console.log(`🌐 Also available in: ${availableLangs.filter(l => l !== lang).map(l => wiktionaryLanguages[l] || l).join(', ')}`);
  }
}

function showHelp() {
  console.log(`
📖 word-def - Multi-language Dictionary CLI (powered by Wiktionary)

Usage:
  word-def <word> [options]

Options:
  -l, --lang <code>  Language code (default: en)
  -h, --help         Show this help message

Examples:
  word-def hello              # English
  word-def perro --lang es     # Spanish  
  word-def chien --lang fr     # French
  word-def Hund --lang de     # German
  word-def cane --lang it     # Italian
  word-def 狗 --lang zh        # Chinese
  word-def собака --lang ru   # Russian
  word-def 犬 --lang ja        # Japanese

Supported languages:
${Object.entries(wiktionaryLanguages).slice(0, 12).map(([c, n]) => `  ${c} - ${n}`).join('\n')}
  ... and more!
`);
}
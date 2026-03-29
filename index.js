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

// Make search case-insensitive - try original first, then lowercase
const searchWord = word.toLowerCase();
const originalWord = word;

if (!word) {
  showHelp();
  process.exit(1);
}

const langName = wiktionaryLanguages[lang] || lang;
fetchFromWiktionary(searchWord, lang);

function fetchFromWiktionary(word, targetLang) {
  // Try original case first, then lowercase
  const wordsToTry = [originalWord, searchWord];
  
  // Try the language-specific Wiktionary first
  const langCodes = [
    targetLang,
    targetLang === 'en' ? null : 'en' // fallback to English
  ];

  tryNextWord(0);

  function tryNextWord(wordIndex) {
    if (wordIndex >= wordsToTry.length) {
      tryNextLanguage(0, null);
      return;
    }
    
    tryNextLanguage(0, wordsToTry[wordIndex]);
  }

  function tryNextLanguage(index, currentWord) {
    if (index >= langCodes.length || !langCodes[index]) {
      // Try next word variant
      tryNextWord(wordsToTry.indexOf(currentWord) + 1);
      return;
    }

    const currentLang = langCodes[index];
    const hostname = currentLang === 'en' ? 'en.wiktionary.org' : `${currentLang}.wiktionary.org`;
    const path = `/api/rest_v1/page/definition/${encodeURIComponent(currentWord)}`;

    const options = {
      hostname,
      path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'word-def-cli/1.0'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          // Check if we got a valid response with definitions
          if (!parsed || Object.keys(parsed).length === 0) {
            tryNextLanguage(index + 1);
            return;
          }

          // Find definitions in the target language
          const targetDefs = parsed[targetLang];
          const fallbackDefs = parsed['en'];
          const definitions = targetDefs || fallbackDefs;

          if (!definitions || definitions.length === 0) {
            tryNextLanguage(index + 1, currentWord);
            return;
          }

          displayDefinitions(currentWord, targetLang, definitions, parsed);

        } catch (e) {
          tryNextLanguage(index + 1, currentWord);
        }
      });
    }).on('error', () => {
      tryNextLanguage(index + 1, currentWord);
    });
  }
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
  word-def狗 --lang zh        # Chinese
  word-def собака --lang ru   # Russian
  worddef 犬 --lang ja        # Japanese

Supported languages:
${Object.entries(wiktionaryLanguages).slice(0, 12).map(([c, n]) => `  ${c} - ${n}`).join('\n')}
  ... and more!
`);
}
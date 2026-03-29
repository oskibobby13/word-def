# word-def

CLI tool to find definitions of any word in multiple languages, powered by Wiktionary.

## Install

```bash
npm install -g word-def
```

## Usage

```bash
word-def <word> [--lang <code>]
```

Examples:
```bash
$ word-def hello
📖 hello (English)

[Noun]
  1. "Hello!" or an equivalent greeting.

[Interjection]
  1. A greeting (salutation) said when meeting someone...
$ word-def perro --lang es
📖 perro (Spanish)

[Noun]
  1. dog (the species Canis familiaris, domesticated for thousands of years...)
  2. clothes peg, clothespin
  3. asshole (despicable person)

[Adjective]
  1. doggy or doggish
  2. awful
  3. wicked; mean
```

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Chinese (zh)
- Korean (ko)
- And 30+ more!

## Options

- `-l, --lang <code>` - Language code (default: en)
- `-h, --help` - Show help

## Features

- Covers 40+ languages via Wiktionary
- Shows multiple definitions per part of speech
- Includes example sentences
- Fallback to English if target language not found
- Shows available translations in other languages
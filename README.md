# word-def

CLI tool to find definitions of any English word using the Free Dictionary API.

## Install

```bash
npm install -g word-def
```

## Usage

```bash
word-def <word>
```

Example:
```bash
$ word-def hello

📖 hello

[noun]
  1. a greeting used when meeting someone
     → "hello, how are you?"
  2. an expression of surprise

[verb]
  1. to say "hello" to someone
     → "he helloed the crowd"
```

## Features

- Fetches definitions from Free Dictionary API
- Shows part of speech
- Displays up to 3 definitions per part of speech
- Shows example sentences when available
- Works offline? No, requires internet
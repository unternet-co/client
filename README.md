# Operator

An experimental client for the web from [Unternet](https://unternet.co).

## Setup

- Run `npm install`
- Copy `.env.example` to `.env` and fill in the required environment variables
- Start the native client with `npm run dev`

## Local Models

Operator has support for running LLM inference locally using [Ollama](https://ollama.com/).
By default, this will be used if no Vite OpenAI API key has been provided as an environment variable.

To set this up on Linux use this to download and install Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Or download the binary from [their webisite](https://ollama.com/download).

Once installed use this to download the qwen2.5-coder:3b model which is the default.

```bash
ollama run qwen2.5-coder:3b
```

## Builds

### Windows

Windows builds are currently unsigned. Signing can be enabled by adding `windows-certs.pfx` and setting the `WINDOWS_CERTS_PASSWORD` secret in GitHub Actions and updating the `certificateFile` and `certificatePassword` fields in `package.json` under the `"win"` section.

## Unternet API

You can optionally add the Unternet API to enable features like web search. In order to do this, add your Unternet API key (don't have one? email us!). For now, this will only work when you build as the API is expected to be local.

# AI provider setup

Dora's AI assistant works with several providers. You can use a hosted provider
with an API key, or run models locally with [Ollama](#ollama-local) — no key,
no data leaving your machine.

This guide covers how to get a key for each provider, which models are
recommended, and how Dora stores your keys.

## Overview

| Provider  | Needs an API key? | Runs locally? |
| --------- | ----------------- | ------------- |
| Groq      | Yes               | No            |
| OpenAI    | Yes               | No            |
| Anthropic | Yes               | No            |
| Gemini    | Yes               | No            |
| Ollama    | No                | Yes           |
| Mock      | No (web demo)     | n/a           |

**Groq is the default provider.** The **Mock** provider is used by the web demo
and returns canned responses — it never makes a real API call.

### Where keys are stored

API keys you save in Dora are encrypted at rest with **AES-256-GCM**. The
encryption master key is generated on first run and kept in your operating
system keychain (Keychain on macOS, the Secret Service / libsecret on Linux,
Credential Manager on Windows) via the OS keyring — it is never written to disk
in plaintext.

You can provide a key in two ways:

1. **In the app** — Sidebar → AI keys → pick a provider → add a key. Saved keys
   are encrypted as described above.
2. **As an environment variable** — if the matching variable below is set in the
   environment Dora launches from, it is merged in automatically (a saved key
   takes precedence).

| Provider  | Environment variable |
| --------- | -------------------- |
| Groq      | `GROQ_API_KEY`       |
| OpenAI    | `OPENAI_API_KEY`     |
| Anthropic | `ANTHROPIC_API_KEY`  |
| Gemini    | `GEMINI_API_KEY`     |

You can verify a key from **Sidebar → AI keys → Test** before using it.

## Provider setup

### Groq

- **Get a key:** <https://console.groq.com/keys>
- **Set in app or via** `GROQ_API_KEY`
- **Recommended models:**
  - `llama-3.3-70b-versatile` (default) — best quality
  - `llama-3.1-8b-instant` — fastest, cheapest
  - `mixtral-8x7b-32768` — long context
- **Notes:** Groq is very fast and has a generous free tier, which is why it is
  Dora's default.

### OpenAI

- **Get a key:** <https://platform.openai.com/api-keys>
- **Set in app or via** `OPENAI_API_KEY`
- **Recommended models:**
  - `gpt-4o` — strong general-purpose, good price/quality
  - `gpt-4o-mini` — fast and inexpensive
  - flagship `gpt-5.5` / `gpt-5.5-pro` when you need maximum capability
- **Notes:** Usage is billed per token; see your OpenAI dashboard for limits and
  cost.

### Anthropic

- **Get a key:** <https://console.anthropic.com/settings/keys>
- **Set in app or via** `ANTHROPIC_API_KEY`
- **Recommended models:**
  - `claude-sonnet-4-6` (default) — balanced quality and speed
  - `claude-opus-4-8` — flagship, highest capability
  - `claude-haiku-4-5` — fast and inexpensive
- **Notes:** Usage is billed per token; see the Anthropic console for limits.

### Gemini

- **Get a key:** <https://aistudio.google.com/app/apikey>
- **Set in app or via** `GEMINI_API_KEY`
- **Recommended models:**
  - `gemini-2.5-flash` (default) — fast, generous free tier
  - `gemini-2.5-pro` — flagship quality
  - `gemini-2.0-flash` — fastest
- **Notes:** Google AI Studio offers a free tier suitable for most usage.

### Ollama (local)

Run models entirely on your own machine — no API key, and no data leaves your
computer.

1. **Install Ollama:** <https://ollama.com/download>. Dora can also guide the
   install from **Sidebar → AI keys → Ollama** if it is not detected.
2. **Pull a model**, for example:
   ```bash
   ollama pull llama3.2
   ```
3. **Select Ollama** as the provider in the assistant. The default model is
   `llama3.2`.

- **Recommended models:** `llama3.2` (good default), or any model you have
  pulled locally. Larger models need more RAM/VRAM.
- **Notes:** Ollama serves on `http://localhost:11434` by default. Make sure the
  Ollama app/service is running before selecting it in Dora.

## Troubleshooting

- **"Invalid key" on Test** — re-copy the key (no surrounding spaces) and confirm
  it belongs to the selected provider.
- **Rate limited** — wait and retry, or switch to a smaller/faster model or a
  different provider.
- **"Model not found"** — the selected model isn't available on your account or,
  for Ollama, hasn't been pulled yet (`ollama pull <model>`).
- **Ollama offline** — start the Ollama app/service and confirm it responds at
  `http://localhost:11434`.

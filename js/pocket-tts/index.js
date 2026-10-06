// AVANT-GARDE — Pocket TTS browser runtime
// Based on pocket-tts-js by vlapky (MIT).
// The Pocket TTS model/voice assets are © Kyutai and CC BY 4.0.

const DEFAULT_MODEL_BASE_URL =
    "https://huggingface.co/vlapky/pocket-tts-onnx/resolve/main/onnx";
const DEFAULT_ORT_BASE_URL =
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/";
const CACHE_NAME = "avantgarde-pocket-tts-v1";

export const LANGUAGES = ["french_24l"];

export class PocketTTS {
    constructor(options = {}) {
        this.options = {
            language: options.language || "french_24l",
            quantized: options.quantized !== false,
            voiceCloning: options.voiceCloning === true,
            modelBaseUrl: (options.modelBaseUrl || DEFAULT_MODEL_BASE_URL).replace(/\/$/, ""),
            ortBaseUrl: options.ortBaseUrl || DEFAULT_ORT_BASE_URL,
            voicesUrl: options.voicesUrl || null,
            maxThreads: options.maxThreads || 8,
            cache: options.cache !== false,
            cacheName: options.cacheName || CACHE_NAME
        };

        this.worker = null;
        this.bundle = null;
        this.ready = false;
        this._nextId = 1;
        this._pending = new Map();
        this._onChunk = null;
        this._onProgress = null;
    }

    get sampleRate() {
        return this.bundle ? this.bundle.sampleRate : 24000;
    }

    get predefinedVoices() {
        return this.bundle ? this.bundle.predefinedVoices : [];
    }

    _ensureWorker() {
        if (this.worker) return;

        this.worker = new Worker(
            new URL("./worker.js", import.meta.url),
            { type: "module" }
        );

        this.worker.onmessage = (event) => this._handleMessage(event.data);

        this.worker.onerror = (event) => {
            const error = new Error(event.message || "Worker error");
            for (const pending of this._pending.values()) {
                pending.reject(error);
            }
            this._pending.clear();
        };
    }

    _handleMessage(message) {
        switch (message.type) {
            case "ready":
                this.bundle = message.bundle;
                return;

            case "chunk":
                if (this._onChunk) {
                    this._onChunk(message.audio, message.meta);
                }
                return;

            case "progress":
            case "status":
                if (this._onProgress) {
                    this._onProgress(message);
                }
                return;

            case "result": {
                const pending = this._pending.get(message.id);
                if (pending) {
                    this._pending.delete(message.id);
                    pending.resolve(message.result);
                }
                return;
            }

            case "error": {
                const pending = this._pending.get(message.id);
                if (pending) {
                    this._pending.delete(message.id);
                    pending.reject(new Error(message.error));
                } else {
                    for (const item of this._pending.values()) {
                        item.reject(new Error(message.error));
                    }
                    this._pending.clear();
                }
                return;
            }

            default:
                return;
        }
    }

    _request(type, payload, transfer) {
        this._ensureWorker();

        const id = this._nextId++;

        return new Promise((resolve, reject) => {
            this._pending.set(id, { resolve, reject });
            this.worker.postMessage(
                { id, type, payload },
                transfer || []
            );
        });
    }

    async load(onProgress) {
        this._onProgress = onProgress || null;
        await this._request("init", this.options);
        this.ready = true;
        return this.bundle;
    }

    async loadVoice(name) {
        const result = await this._request(
            "loadBuiltinVoice",
            { name }
        );
        return result.ref;
    }

    async cloneVoice(audioData, ref = "cloned-voice") {
        if (!audioData || !audioData.length) {
            throw new Error("Aucun audio de référence fourni.");
        }

        const pcm = audioData instanceof Float32Array
            ? audioData
            : new Float32Array(audioData);

        const result = await this._request(
            "cloneVoice",
            {
                audio: pcm,
                ref
            }
        );

        return result.ref;
    }

    async generate(text, options = {}) {
        if (!options.voice) {
            throw new Error("generate() nécessite une voix préparée.");
        }

        this._onChunk = options.onChunk || null;
        this._onProgress = options.onProgress || null;

        try {
            const result = await this._request(
                "generate",
                {
                    text,
                    voiceRef: options.voice
                }
            );

            return result.metrics;
        } finally {
            this._onChunk = null;
            this._onProgress = null;
        }
    }

    async stop() {
        if (!this.worker) return;
        await this._request("stop", {});
    }

    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        this._pending.clear();
        this.ready = false;
        this.bundle = null;
    }

    static async clearCache(cacheName = CACHE_NAME) {
        if (typeof caches === "undefined") return false;
        return caches.delete(cacheName);
    }

    static async storageEstimate() {
        if (
            typeof navigator === "undefined" ||
            !navigator.storage ||
            !navigator.storage.estimate
        ) {
            return null;
        }

        const result = await navigator.storage.estimate();

        return {
            usage: result.usage || 0,
            quota: result.quota || 0
        };
    }
}

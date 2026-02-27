import * as THREE from "three";

type VolumeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class SoundManager {
    private static listener: THREE.AudioListener | null = null;
    private static loader = new THREE.AudioLoader();

    private static bufferCache = new Map<string, AudioBuffer>();

    private static volumeLevel: VolumeLevel = 3;
    private static ambient: THREE.Audio | null = null;
    private static ambientPath: string | null = null;

    private static unlockPromise: Promise<void> | null = null;

    /**
     * Call once. Pass either a camera (recommended) or an existing AudioListener.
     */
    public static init(camera: THREE.Camera): void {
        if (!SoundManager.listener) {
            SoundManager.listener = new THREE.AudioListener();
        }
        SoundManager.attachToCamera(camera);
    }

    public static attachToCamera(camera: THREE.Camera): void {
        const listener = SoundManager.requireListener();

        const currentParent = listener.parent;
        if (currentParent) {
            currentParent.remove(listener);
        }

        camera.add(listener);
    }

    public static async toggleAmbient(): Promise<void> {
        if (!SoundManager.ambient) {
            if (SoundManager.ambientPath) {
                await SoundManager.initAmbientSound(SoundManager.ambientPath);
            } else {
                throw new Error("SoundManager.toggleAmbient(): No ambient sound initialized.");
            }
        }

        if (SoundManager.ambient!.isPlaying) {
            SoundManager.stopAmbient();
            return;
        }

        await SoundManager.unlock();
        await SoundManager.playAmbient();
    }

    /**
     * Browsers often require a user gesture before audio can play.
     * Call this inside a click/tap/keydown handler.
     * Safe to call multiple times.
     */
    public static async unlock(): Promise<void> {
        const listener = SoundManager.requireListener();
        const ctx = listener.context;

        // Already unlocked / running
        if (ctx.state === "running") return;

        // If an unlock attempt is already in progress, await it.
        if (SoundManager.unlockPromise) {
            await SoundManager.unlockPromise;
            return;
        }

        // Start a single unlock attempt
        SoundManager.unlockPromise = (async () => {
            // Re-check inside the promise in case state changed
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
        })();

        try {
            await SoundManager.unlockPromise;
        } finally {
            SoundManager.unlockPromise = null;
        }
    }

    public static setVolume(level: number): void {
        const clamped = Math.min(10, Math.max(1, Math.round(level))) as VolumeLevel;
        SoundManager.volumeLevel = clamped;

        // Apply to ambient immediately
        if (SoundManager.ambient) {
            SoundManager.ambient.setVolume(SoundManager.volumeLevel / 10);
        }
    }

    public static getVolume(): VolumeLevel {
        return SoundManager.volumeLevel;
    }

    public static async playSound(path: string, volumeOverride?: number): Promise<void> {
        const listener = SoundManager.requireListener();

        // Attempt unlock (still best if called from a user gesture)
        await SoundManager.safeResume(listener);

        const buffer = await SoundManager.loadBuffer(path);
        const audio = new THREE.Audio(listener);

        const volLevel = volumeOverride !== undefined
            ? (Math.min(10, Math.max(1, Math.round(volumeOverride))) / 10)
            : (SoundManager.volumeLevel / 10);

        audio.setBuffer(buffer);
        audio.setLoop(false);
        audio.setVolume(volLevel);

        // Start
        audio.play();

        // Clean up after finishing (best effort)
        // Three's Audio wraps WebAudio nodes; stopping/disconnecting helps GC a bit.
        const source: any = (audio as any).source;
        if (source && typeof source.onended !== "undefined") {
            source.onended = () => {
                try {
                    audio.stop();
                    audio.disconnect();
                } catch {
                    // ignore
                }
            };
        }
    }

    public static async initAmbientSound(path: string): Promise<void> {
        const listener = SoundManager.requireListener();

        SoundManager.ambientPath = path;

        const buffer = await SoundManager.loadBuffer(path);
        const ambient = new THREE.Audio(listener);

        ambient.setBuffer(buffer);
        ambient.setLoop(true);
        ambient.setVolume(SoundManager.volumeLevel / 10);

        SoundManager.ambient = ambient;
    }

    public static async playAmbient(): Promise<void> {
        const listener = SoundManager.requireListener();

        if (!SoundManager.ambient) {
            if (SoundManager.ambientPath) {
                await SoundManager.initAmbientSound(SoundManager.ambientPath);
            } else {
                throw new Error("SoundManager.playAmbient(): No ambient sound initialized.");
            }
        }

        await SoundManager.safeResume(listener);

        if (SoundManager.ambient && !SoundManager.ambient.isPlaying) {
            SoundManager.ambient.play();
        }
    }

    public static stopAmbient(): void {
        if (SoundManager.ambient && SoundManager.ambient.isPlaying) {
            SoundManager.ambient.stop();
        }
    }

    // ---------- internals ----------

    private static requireListener(): THREE.AudioListener {
        if (!SoundManager.listener) {
            throw new Error(
                "SoundManager not initialized. Call SoundManager.init(cameraOrListener) first."
            );
        }
        return SoundManager.listener;
    }

    private static async safeResume(listener: THREE.AudioListener): Promise<void> {
        const ctx = listener.context;
        if (ctx.state === "suspended") {
            // This may still fail if not triggered by a user gesture in some browsers.
            try {
                await ctx.resume();
            } catch {
                // swallow: caller can still succeed later after user interaction
            }
        }
    }

    private static loadBuffer(path: string): Promise<AudioBuffer> {
        const cached = SoundManager.bufferCache.get(path);
        if (cached) return Promise.resolve(cached);

        return new Promise((resolve, reject) => {
            SoundManager.loader.load(
                path,
                (buffer) => {
                    SoundManager.bufferCache.set(path, buffer);
                    resolve(buffer);
                },
                undefined,
                (err) => reject(err)
            );
        });
    }
}
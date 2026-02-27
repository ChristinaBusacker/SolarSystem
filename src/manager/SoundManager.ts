import * as THREE from "three";

type VolumeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class SoundManager {
    private static listener: THREE.AudioListener | null = null;
    private static loader = new THREE.AudioLoader();

    private static bufferCache = new Map<string, AudioBuffer>();

    // Note: You currently default to 3 (=30%). If you want 50%, set this to 5.
    private static volumeLevel: VolumeLevel = 3;

    private static ambientPath: string | null = null;

    private static unlockPromise: Promise<void> | null = null;

    private static visibilityBound = false;
    private static resumeAmbientOnVisible = false;
    private static stopAmbientOnHidden = true;
    private static ambientWasPlayingBeforeHide = false;

    // --- Ambient (manual WebAudio for pause/resume position) ---
    private static ambientBuffer: AudioBuffer | null = null;
    private static ambientGain: GainNode | null = null;
    private static ambientSource: AudioBufferSourceNode | null = null;

    private static ambientOffsetSec = 0;     // where we paused (in seconds)
    private static ambientStartedAtSec = 0; // ctx.currentTime when we started/resumed
    private static ambientPlaying = false;

    // If autoplay blocked a resume, remember and retry on next unlock() call.
    private static pendingAmbientResume = false;

    /**
     * Call once. Pass a camera (recommended).
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
        if (!SoundManager.ambientBuffer) {
            if (SoundManager.ambientPath) {
                await SoundManager.initAmbientSound(SoundManager.ambientPath);
            } else {
                throw new Error("SoundManager.toggleAmbient(): No ambient sound initialized.");
            }
        }

        if (SoundManager.ambientPlaying) {
            SoundManager.pauseAmbient(); // keep position
            return;
        }

        await SoundManager.unlock();
        await SoundManager.playAmbient();
    }

    public static bindVisibilityHandling(opts?: {
        stopAmbientOnHidden?: boolean;
        resumeAmbientOnVisible?: boolean;
    }): void {
        if (SoundManager.visibilityBound) return;

        SoundManager.stopAmbientOnHidden = opts?.stopAmbientOnHidden ?? true;
        SoundManager.resumeAmbientOnVisible = opts?.resumeAmbientOnVisible ?? false;

        const handler = async () => {
            if (document.visibilityState === "hidden") {
                if (!SoundManager.stopAmbientOnHidden) return;

                SoundManager.ambientWasPlayingBeforeHide = SoundManager.ambientPlaying;
                SoundManager.pauseAmbient(); // keep position instead of restarting later
                return;
            }

            if (SoundManager.resumeAmbientOnVisible && SoundManager.ambientWasPlayingBeforeHide) {
                SoundManager.ambientWasPlayingBeforeHide = false;

                try {
                    await SoundManager.unlock();
                    await SoundManager.playAmbient(); // resumes at stored offset
                } catch {
                    // If autoplay blocks, it will resume after next user interaction (unlock()).
                }
            }
        };

        document.addEventListener("visibilitychange", handler);

        window.addEventListener("pagehide", () => {
            if (!SoundManager.stopAmbientOnHidden) return;
            SoundManager.ambientWasPlayingBeforeHide = SoundManager.ambientPlaying;
            SoundManager.pauseAmbient();
        });

        SoundManager.visibilityBound = true;
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
        if (ctx.state === "running") {
            // If we have a pending ambient resume request, try it now.
            if (SoundManager.pendingAmbientResume) {
                SoundManager.pendingAmbientResume = false;
                try {
                    await SoundManager.playAmbient();
                } catch {
                    // ignore
                }
            }
            return;
        }

        // If an unlock attempt is already in progress, await it.
        if (SoundManager.unlockPromise) {
            await SoundManager.unlockPromise;
            return;
        }

        // Start a single unlock attempt
        SoundManager.unlockPromise = (async () => {
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
        })();

        try {
            await SoundManager.unlockPromise;
        } finally {
            SoundManager.unlockPromise = null;
        }

        // Retry ambient resume if it was blocked earlier.
        if (SoundManager.pendingAmbientResume) {
            SoundManager.pendingAmbientResume = false;
            try {
                await SoundManager.playAmbient();
            } catch {
                // ignore
            }
        }
    }

    public static setVolume(level: number): void {
        const clamped = Math.min(10, Math.max(1, Math.round(level))) as VolumeLevel;
        SoundManager.volumeLevel = clamped;

        // Apply to ambient immediately
        if (SoundManager.ambientGain) {
            SoundManager.ambientGain.gain.value = SoundManager.volumeLevel / 10;
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

        audio.play();

        // Clean up after finishing (best effort)
        const source: any = audio.source;
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

    // ---------- Ambient (with pause/resume position) ----------

    public static async initAmbientSound(path: string): Promise<void> {
        const listener = SoundManager.requireListener();

        SoundManager.ambientPath = path;

        // Stop any existing ambient and reset nodes (keep it simple and predictable)
        SoundManager.stopAmbient();

        SoundManager.ambientBuffer = await SoundManager.loadBuffer(path);

        // Ensure gain node exists and is connected into Three’s listener chain
        if (!SoundManager.ambientGain) {
            const ctx = listener.context;
            SoundManager.ambientGain = ctx.createGain();
            SoundManager.ambientGain.connect(listener.getInput());
        }

        SoundManager.ambientGain.gain.value = SoundManager.volumeLevel / 10;

        // Prepared, not playing yet
        SoundManager.ambientOffsetSec = 0;
        SoundManager.ambientPlaying = false;
        SoundManager.pendingAmbientResume = false;
    }

    public static async playAmbient(): Promise<void> {
        const listener = SoundManager.requireListener();
        const ctx = listener.context;

        if (!SoundManager.ambientBuffer) {
            if (SoundManager.ambientPath) {
                await SoundManager.initAmbientSound(SoundManager.ambientPath);
            } else {
                throw new Error("SoundManager.playAmbient(): No ambient sound initialized.");
            }
        }

        if (SoundManager.ambientPlaying) return;

        // Best-effort resume of audio context
        await SoundManager.safeResume(listener);

        // If still suspended, autoplay is blocking us; remember intent and bail.
        if (ctx.state !== "running") {
            SoundManager.pendingAmbientResume = true;
            return;
        }

        // Create fresh source (BufferSource nodes are one-shot)
        const source = ctx.createBufferSource();
        source.buffer = SoundManager.ambientBuffer!;
        source.loop = true;

        // Ensure gain exists
        if (!SoundManager.ambientGain) {
            SoundManager.ambientGain = ctx.createGain();
            SoundManager.ambientGain.connect(listener.getInput());
        }
        SoundManager.ambientGain.gain.value = SoundManager.volumeLevel / 10;

        source.connect(SoundManager.ambientGain);

        // Wrap offset into duration (important when looping)
        const dur = SoundManager.ambientBuffer!.duration || 0;
        const startOffset = dur > 0 ? (SoundManager.ambientOffsetSec % dur) : 0;

        SoundManager.ambientStartedAtSec = ctx.currentTime;
        SoundManager.ambientSource = source;
        SoundManager.ambientPlaying = true;

        source.onended = () => {
            SoundManager.ambientPlaying = false;
            SoundManager.ambientSource = null;
        };

        source.start(0, startOffset);
    }

    /**
     * Pause ambient and remember position (so it resumes where it left off).
     */
    public static pauseAmbient(): void {
        const listener = SoundManager.listener;
        const ctx = listener?.context;

        if (!SoundManager.ambientSource || !ctx || !SoundManager.ambientPlaying) return;

        const elapsed = ctx.currentTime - SoundManager.ambientStartedAtSec;
        const dur = SoundManager.ambientBuffer?.duration ?? 0;

        if (dur > 0) {
            SoundManager.ambientOffsetSec = (SoundManager.ambientOffsetSec + Math.max(0, elapsed)) % dur;
        } else {
            SoundManager.ambientOffsetSec += Math.max(0, elapsed);
        }

        try {
            SoundManager.ambientSource.stop();
            SoundManager.ambientSource.disconnect();
        } catch {
            // ignore
        }

        SoundManager.ambientSource = null;
        SoundManager.ambientPlaying = false;
    }

    /**
     * Stop ambient and reset position to the beginning.
     */
    public static stopAmbient(): void {
        SoundManager.pauseAmbient();
        SoundManager.ambientOffsetSec = 0;
        SoundManager.pendingAmbientResume = false;
    }

    // ---------- internals ----------

    private static requireListener(): THREE.AudioListener {
        if (!SoundManager.listener) {
            throw new Error("SoundManager not initialized. Call SoundManager.init(camera) first.");
        }
        return SoundManager.listener;
    }

    private static async safeResume(listener: THREE.AudioListener): Promise<void> {
        // Delegate to unlock logic (with in-flight protection), but be forgiving.
        try {
            await SoundManager.unlock();
        } catch {
            // Autoplay restrictions can still block until a real user gesture happens.
        }

        // Some browsers can still be suspended after the attempt.
        const ctx = listener.context;
        if (ctx.state === "suspended") {
            try {
                await ctx.resume();
            } catch {
                // ignore
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
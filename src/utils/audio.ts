import { UserPreferences } from '../services/userService';

const CORRECT_SOUND_URL = '/sounds/am thanh khi chon dung.mp3';
const WRONG_SOUND_URL = '/sounds/am thanh khi chon sai.mp3';
const NOTIFICATION_SOUND_URL = '/sounds/am thanh thong.mp3';

class AudioService {
    private correctAudio: HTMLAudioElement | null = null;
    private wrongAudio: HTMLAudioElement | null = null;
    private notificationAudio: HTMLAudioElement | null = null;
    private soundEnabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            this.correctAudio = new Audio(CORRECT_SOUND_URL);
            this.wrongAudio = new Audio(WRONG_SOUND_URL);
            this.notificationAudio = new Audio(NOTIFICATION_SOUND_URL);

            // Preload
            this.correctAudio.load();
            this.wrongAudio.load();
            this.notificationAudio.load();
        }
    }

    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled;
    }

    private shouldPlaySound(preferences?: UserPreferences): boolean {
        // If preferences not available, use default (play sound)
        if (!preferences) return this.soundEnabled;
        return preferences.soundEffects && this.soundEnabled;
    }

    playCorrect(preferences?: UserPreferences) {
        if (!this.shouldPlaySound(preferences)) return;
        if (this.correctAudio) {
            this.correctAudio.currentTime = 0;
            this.correctAudio.play().catch(e => console.warn('Audio play blocked:', e));
        }
    }

    playWrong(preferences?: UserPreferences) {
        if (!this.shouldPlaySound(preferences)) return;
        if (this.wrongAudio) {
            this.wrongAudio.currentTime = 0;
            this.wrongAudio.play().catch(e => console.warn('Audio play blocked:', e));
        }
    }

    playNotification(preferences?: UserPreferences) {
        if (!this.shouldPlaySound(preferences)) return;
        if (this.notificationAudio) {
            this.notificationAudio.currentTime = 0;
            this.notificationAudio.play().catch(e => console.warn('Audio play blocked:', e));
        }
    }
}

export const audioService = new AudioService();

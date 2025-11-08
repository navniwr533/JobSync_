// Voice Recognition Module
class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.currentCallback = null;
        this.currentTranscript = '';
        
        this.initializeVoiceRecognition();
    }

    initializeVoiceRecognition() {
        // Check for browser support
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.isSupported = true;
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
        } else {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Set up event listeners
        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.currentTranscript = finalTranscript || interimTranscript;
            
            if (this.currentCallback) {
                this.currentCallback({
                    transcript: this.currentTranscript,
                    isFinal: finalTranscript.length > 0,
                    confidence: event.results[event.results.length - 1][0].confidence || 0.5
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            if (this.currentCallback) {
                this.currentCallback({
                    error: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
        };
    }

    getErrorMessage(error) {
        const errorMessages = {
            'network': 'Network error occurred. Please check your internet connection.',
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'service-not-allowed': 'Speech recognition service not allowed.',
            'bad-grammar': 'Speech recognition grammar error.',
            'language-not-supported': 'Language not supported.',
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Audio capture failed. Please check your microphone.',
            'aborted': 'Speech recognition aborted.'
        };
        
        return errorMessages[error] || 'An unknown error occurred with speech recognition.';
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately as we just needed permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }

    async startListening(callback) {
        if (!this.isSupported) {
            callback({
                error: 'not-supported',
                message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
            });
            return false;
        }

        // Request microphone permission first
        const permissionGranted = await this.requestMicrophonePermission();
        if (!permissionGranted) {
            callback({
                error: 'not-allowed',
                message: 'Microphone access is required for voice recording. Please allow microphone access and try again.'
            });
            return false;
        }

        if (this.isListening) {
            this.stopListening();
        }

        this.currentCallback = callback;
        this.currentTranscript = '';
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            callback({
                error: 'start-failed',
                message: 'Failed to start voice recognition. Please try again.'
            });
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.currentCallback = null;
    }

    isCurrentlyListening() {
        return this.isListening;
    }

    isVoiceSupported() {
        return this.isSupported;
    }

    // Get current transcript without stopping
    getCurrentTranscript() {
        return this.currentTranscript;
    }
}

// Export for use in other files
window.VoiceRecognition = VoiceRecognition;
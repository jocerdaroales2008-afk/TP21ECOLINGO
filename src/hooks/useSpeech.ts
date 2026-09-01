import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

interface SpeechState {
  isListening: boolean;
  transcript: string;
  isSpeaking: boolean;
  isPaused: boolean;
  supported: boolean;
}

interface SpeechRecognitionResultEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function useSpeech() {
  const { speechRate, autoSpeak, speak, stopSpeaking, isSpeaking } = useAccessibility();
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    transcript: '',
    isSpeaking: false,
    isPaused: false,
    supported: false,
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'es-ES';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: SpeechRecognitionResultEvent) => {
        const transcript = e.results[0][0].transcript;
        setState((s) => ({ ...s, transcript, isListening: false }));
      };
      rec.onerror = () => setState((s) => ({ ...s, isListening: false }));
      rec.onend = () => setState((s) => ({ ...s, isListening: false }));
      recognitionRef.current = rec;
    }

    setState((s) => ({
      ...s,
      supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    }));

    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setState((s) => ({ ...s, isListening: true, transcript: '' }));
    try {
      recognitionRef.current.start();
    } catch {
      setState((s) => ({ ...s, isListening: false }));
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
    setState((s) => ({ ...s, isSpeaking: false, isPaused: false }));
  }, [stopSpeaking]);

  return {
    ...state,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stop,
    speechRate,
    autoSpeak,
  };
}

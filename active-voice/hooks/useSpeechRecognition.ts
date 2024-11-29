import { SpeechRecognitionContext } from "@/contexts/SpeechRecognitionContext";
import { useContext } from "react";

export function useSpeechRecognition() {
    const context = useContext(SpeechRecognitionContext);
    if (!context) {
        throw new Error("useSpeechRecognition must be used within a SpeechRecognitionProvider");
    }
    return context;
}
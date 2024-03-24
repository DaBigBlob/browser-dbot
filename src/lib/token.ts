import { libAlert, libLocalStorage } from "./lib";

export function getToken(): string|null {
    const storage_token = libLocalStorage.getItem("TOKEN");
    if (storage_token) return storage_token;

    const prompt_token = window.prompt("Your Discord Bot token");
    if (prompt_token) {
        try {
            libLocalStorage.setItem("TOKEN", prompt_token);
        } catch {
            return null;
        }
        return prompt_token;
    }

    libAlert("Token not set. This app will not work.");
    return null;
}
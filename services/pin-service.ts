/**
 * PIN Service - Handles PIN change API calls for Purok Leaders
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';
const CHANGE_PIN_ENDPOINT = '/api/v1/purok-leader/change-pin';

export interface ChangePinResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        refreshToken: string;
    };
    errors?: Record<string, string[]>;
}

/**
 * Change PIN for Purok Leader.
 * Returns new token pair on success.
 */
export async function changePin(
    accessToken: string,
    currentPin: string,
    newPin: string,
    newPinConfirmation: string,
): Promise<ChangePinResponse> {
    const url = `${API_BASE}${CHANGE_PIN_ENDPOINT}`;

    console.log('[PinService] Changing PIN...');

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-Requested-With': 'XMLHttpRequest',
            'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
            current_pin: currentPin,
            new_pin: newPin,
            new_pin_confirmation: newPinConfirmation,
        }),
    });

    const responseText = await resp.text();
    let data: ChangePinResponse;

    try {
        data = JSON.parse(responseText);
    } catch {
        console.error('[PinService] Failed to parse response:', responseText.substring(0, 500));
        throw new Error('Invalid response from server');
    }

    if (!resp.ok) {
        console.error('[PinService] Change PIN failed:', resp.status, data.message);

        // 401 = wrong current PIN
        if (resp.status === 401) {
            throw new Error(data.message || 'Current PIN is incorrect');
        }

        // 422 = validation errors
        if (resp.status === 422) {
            // Extract first error message from validation errors
            if (data.errors) {
                const firstError = Object.values(data.errors).flat()[0];
                throw new Error(firstError || data.message || 'Validation failed');
            }
            throw new Error(data.message || 'Validation failed');
        }

        // Other errors
        throw new Error(data.message || `Failed to change PIN (${resp.status})`);
    }

    console.log('[PinService] ✅ PIN changed successfully');
    return data;
}

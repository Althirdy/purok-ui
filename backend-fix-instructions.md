# Backend Fix: Change PIN — Class Not Found

## Error

```
Class "App\Http\Requests\Api\V1\ChangePinRequest" does not exist
```

This occurs when the mobile app calls `POST /api/v1/purok-leader/change-pin`.

## Fix

In `PinController.php`, update the import:

```diff
- use App\Http\Requests\Api\V1\ChangePinRequest;
+ use App\Http\Requests\Api\V1\PurokLeader\ChangePinRequest;
```

## Mobile Request Format

The mobile app sends the following JSON body:

```json
{
  "current_pin": "1234",
  "new_pin": "5678",
  "new_pin_confirmation": "5678"
}
```

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer {token}`

## Expected Response (Success — 200)

```json
{
  "success": true,
  "message": "PIN changed successfully",
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

## Expected Error Responses

| Status | Meaning | Example message |
|--------|---------|-----------------|
| 401 | Wrong current PIN | `"Current PIN is incorrect"` |
| 422 | Validation error | `"The new pin must be 4 digits"` |
| 401 | Default PIN not changed (middleware) | `"Please change your default PIN"` |
r
> **Important:** The mobile app detects the forced PIN change by checking if a 401 response body contains `"change your default PIN"` or `"change your PIN"`. Please make sure the middleware message includes one of these phrases.

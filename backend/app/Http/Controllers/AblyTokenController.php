<?php

namespace App\Http\Controllers;

use Ably\AblyRest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AblyTokenController extends Controller
{
    public function issue(Request $request): JsonResponse
    {
        $user  = $request->user();
        $ably  = new AblyRest(config('services.ably.key'));

        // Scope capabilities to only channels this user is allowed to access.
        // Private channels follow the pattern: private:<type>.<id>
        $capabilities = [
            // Their personal notification channel
            'private:notifications.' . $user->id => ['subscribe'],
            // Any conversation they are a participant in
            'private:conversation.*'              => ['subscribe'],
        ];

        // Faculty and students can also publish typing events
        if (in_array($user->role, ['faculty', 'student'])) {
            $capabilities['private:conversation.*'][] = 'publish';
            $capabilities['private:conversation.*'][] = 'presence';
        }

        $tokenRequest = $ably->auth->createTokenRequest([
            'clientId'    => (string) $user->id,
            'capability'  => json_encode($capabilities),
            'ttl'         => 3600 * 1000, // 1 hour in milliseconds
        ]);

        return response()->json($tokenRequest);
    }
}

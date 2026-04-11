<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
        ]);

        $identifier = trim($request->string('identifier')->toString());
        $user = $this->resolveUserFromIdentifier($identifier);

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'identifier' => ['This account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->logger->log($user, 'auth.login', 'user', $user->id, [
            'identifier' => $identifier,
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        return response()->json([
            'user'  => $user->loadMissing(['student', 'faculty', 'vpaaProfile']),
            'token' => $token,
        ]);
    }

    private function resolveUserFromIdentifier(string $identifier): ?User
    {
        $user = User::where('email', $identifier)->first();

        if ($user) {
            return $user;
        }

        $student = StudentProfile::where('student_id', $identifier)->first();
        if ($student) {
            return $student->user;
        }

        $faculty = FacultyProfile::where('faculty_id', $identifier)->first();
        if ($faculty) {
            return $faculty->user;
        }

        return null;
    }

    public function logout(Request $request): JsonResponse
    {
        $this->logger->log($request->user(), 'auth.logout', 'user', $request->user()->id, [
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->loadMissing(['student', 'faculty', 'vpaaProfile'])]);
    }
}

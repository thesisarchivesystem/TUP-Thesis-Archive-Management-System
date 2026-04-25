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
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
        ]);

        $identifier = trim($request->string('identifier')->toString());
        $user = $this->resolveUserFromIdentifier($identifier);

        if (!$user) {
            throw ValidationException::withMessages([
                'identifier' => ['We could not find an account matching that identifier.'],
            ]);
        }

        $status = Password::broker()->sendResetLink([
            'email' => $user->email,
        ]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'identifier' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'If the account exists and can receive mail, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'Your password has been reset successfully.',
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

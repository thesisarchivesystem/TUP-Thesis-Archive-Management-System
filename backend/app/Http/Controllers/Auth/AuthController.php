<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'exists:users,email'],
        ], [
            'email.exists' => 'We could not find an account with that email address.',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account is unavailable for password reset.'],
            ]);
        }

        $status = Password::sendResetLink([
            'email' => $validated['email'],
        ]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        $this->logger->log($user, 'auth.password_reset_requested', 'user', $user->id, [
            'email' => $validated['email'],
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'A password reset link has been sent to your email address.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'exists:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.exists' => 'We could not find an account with that email address.',
        ]);

        $resetRecord = DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))
            ->where('email', $validated['email'])
            ->first();

        if (!$resetRecord || !isset($resetRecord->created_at)) {
            throw ValidationException::withMessages([
                'email' => ['This password reset link is invalid or no longer available.'],
            ]);
        }

        $expiresAfterMinutes = (int) config('auth.passwords.users.expire', 60);
        $expiresAt = Carbon::parse($resetRecord->created_at)->addMinutes($expiresAfterMinutes);

        if ($expiresAt->isPast()) {
            DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))
                ->where('email', $validated['email'])
                ->delete();

            throw ValidationException::withMessages([
                'email' => ['This password reset link has expired. Please request a new one.'],
            ]);
        }

        $status = Password::reset(
            $validated,
            function (User $user) use ($validated) {
                $user->forceFill([
                    'password' => Hash::make($validated['password']),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $this->logger->log($user, 'auth.password_reset_completed', 'user', $user->id, [
                'email' => $validated['email'],
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);
        }

        return response()->json([
            'message' => 'Your password has been reset successfully.',
        ]);
    }
}

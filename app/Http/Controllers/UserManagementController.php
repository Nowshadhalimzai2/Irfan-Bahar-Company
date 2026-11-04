<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function create(): Response
    {
        $isFirstUser = ! User::query()->exists();

        if (! $isFirstUser) {
            Gate::authorize('manage-users');
        } else {
            foreach (Role::SUPPORTED_NAMES as $roleName) {
                Role::firstOrCreate(['name' => $roleName]);
            }
        }

        $roles = Role::query()
            ->whereIn('name', Role::SUPPORTED_NAMES)
            ->when(
                $isFirstUser,
                fn ($query) => $query->where('name', 'super_admin'),
                fn ($query) => Auth::user()?->hasRole('super_admin')
                    ? $query
                    : $query->where('name', '!=', 'super_admin'),
            )
            ->orderBy('id')
            ->get(['id', 'name']);

        return Inertia::render('auth/register', [
            'passwordRules' => \Illuminate\Validation\Rules\Password::defaults()->toPasswordRulesString(),
            'roles' => $roles,
        ]);
    }

    public function store(Request $request, CreateNewUser $creator): RedirectResponse
    {
        if (User::query()->exists()) {
            Gate::authorize('manage-users');
        }

        $user = DB::transaction(function () use ($request, $creator): User {
            $user = $creator->create($request->all());

            if (! Auth::check()) {
                Auth::login($user);
            }

            (new Log())->create('insert', ' یوزر  جدید', $user->name);

            return $user;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => " موفقانه ایجاد شد {$user->name} اکونت یوزر"]);

        return redirect()->route('dashboard');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->status && $actor->hasRole('super_admin'), 403);

        $validated = $request->validate([
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(
                    fn (Builder $query) => $query->whereIn('name', Role::SUPPORTED_NAMES),
                ),
            ],
        ]);

        DB::transaction(function () use ($actor, $user, $validated): void {
            $superAdminRole = $this->lockSuperAdminRole();
            $target = User::query()->lockForUpdate()->findOrFail($user->id);
            $newRoleId = (int) $validated['role_id'];

            if ($actor->is($target)) {
                throw ValidationException::withMessages([
                    'role_id' => 'نقش حساب خود را نمی‌توانید تغییر دهید.',
                ]);
            }

            if ($target->role_id === $newRoleId) {
                return;
            }

            $oldRoleName = $target->role()->value('name');
            $newRoleName = Role::query()->findOrFail($newRoleId)->name;

            if ($target->status && $target->role_id === $superAdminRole->id && $newRoleId !== $superAdminRole->id) {
                $activeSuperAdminIds = User::query()
                    ->whereHas('role', fn ($query) => $query->where('name', 'super_admin'))
                    ->where('status', true)
                    ->lockForUpdate()
                    ->pluck('id');

                if ($activeSuperAdminIds->count() <= 1) {
                    throw ValidationException::withMessages([
                        'role_id' => 'حداقل یک سوپر ادمین فعال باید باقی بماند.',
                    ]);
                }
            }

            $target->role_id = $newRoleId;
            $target->save();
            (new Log())->create(
                'update',
                'نقش کاربر تغییر کرد',
                "{$target->name}: {$oldRoleName} -> {$newRoleName}",
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'نقش کاربر با موفقیت تغییر کرد.']);

        return back();
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User && $actor->status && $actor->hasRole('super_admin'), 403);

        $validated = $request->validate([
            'status' => ['required', 'boolean'],
        ]);
        $newStatus = $request->boolean('status');

        DB::transaction(function () use ($actor, $user, $newStatus): void {
            $superAdminRole = $this->lockSuperAdminRole();
            $target = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($actor->is($target)) {
                throw ValidationException::withMessages([
                    'status' => 'وضعیت حساب خود را نمی‌توانید تغییر دهید.',
                ]);
            }

            if ($target->status === $newStatus) {
                return;
            }

            if (! $newStatus && $target->status && $target->role_id === $superAdminRole->id) {
                $activeSuperAdminIds = User::query()
                    ->whereHas('role', fn ($query) => $query->where('name', 'super_admin'))
                    ->where('status', true)
                    ->lockForUpdate()
                    ->pluck('id');

                if ($activeSuperAdminIds->count() <= 1) {
                    throw ValidationException::withMessages([
                        'status' => 'حداقل یک سوپر ادمین فعال باید باقی بماند.',
                    ]);
                }
            }

            $target->status = $newStatus;
            $target->save();
            (new Log())->create(
                'update',
                'وضعیت کاربر تغییر کرد',
                "{$target->name}: " . ($newStatus ? 'فعال' : 'مسدود'),
            );
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $newStatus ? 'اکونت کاربر فعال شد.' : 'اکونت کاربر مسدود شد و فقط دسترسی خواندن دارد.',
        ]);

        return back();
    }

    private function lockSuperAdminRole(): Role
    {
        return Role::query()
            ->where('name', 'super_admin')
            ->lockForUpdate()
            ->firstOrFail();
    }
}

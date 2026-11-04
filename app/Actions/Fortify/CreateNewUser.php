<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        return DB::transaction(function () use ($input): User {
            $this->ensureDefaultRolesExist();
            $superAdminRole = Role::query()
                ->where('name', 'super_admin')
                ->lockForUpdate()
                ->firstOrFail();
            $isFirstUser = ! User::query()->exists();
            $currentUser = Auth::user();

            if (! $isFirstUser) {
                abort_unless(
                    $currentUser instanceof User
                        && $currentUser->status
                        && $currentUser->hasAnyRole(['admin', 'super_admin']),
                    403,
                );
            }

            $validationRules = [
                ...$this->profileRules(),
                'password' => $this->passwordRules(),
            ];

            if (! $isFirstUser) {
                $validationRules['role_id'] = [
                    'required',
                    'integer',
                    Rule::exists('roles', 'id')->where(
                        fn (Builder $query) => $query->whereIn('name', Role::SUPPORTED_NAMES),
                    ),
                ];
            }

            Validator::make($input, $validationRules)->validate();

            $roleId = $isFirstUser ? $superAdminRole->id : (int) $input['role_id'];
            $role = Role::query()->findOrFail($roleId);

            if (! $isFirstUser && ! $currentUser->hasRole('super_admin') && $role->name === 'super_admin') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'role_id' => 'فقط سوپر ادمین می‌تواند این نقش را تعیین کند.',
                ]);
            }

            return User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role_id' => $roleId,
            ]);
        });
    }

    private function ensureDefaultRolesExist(): void
    {
        foreach (Role::SUPPORTED_NAMES as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }
    }
}

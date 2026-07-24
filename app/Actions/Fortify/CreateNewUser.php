<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Role;
use App\Models\User;
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
        $isFirstUser = User::query()->count() === 0;

        if ($isFirstUser) {
            $this->ensureDefaultRolesExist();
        }

        $validationRules = [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ];

        if (! $isFirstUser) {
            $validationRules['role_id'] = ['required', 'exists:roles,id'];
        }

        Validator::make($input, $validationRules)->validate();

        $roleId = $input['role_id'] ?? null;

        if ($isFirstUser) {
            $roleId = Role::where('name', 'super_admin')->value('id');
        }

        if (! $roleId) {
            throw new \InvalidArgumentException('A valid role is required to create a user.');
        }

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'role_id' => $roleId,
        ]);
    }

    private function ensureDefaultRolesExist(): void
    {
        foreach (['super_admin', 'admin', 'shop_clerk', 'factory_clerk'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }
    }
}

<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocked_users_can_read_but_cannot_change_application_data(): void
    {
        $user = $this->createUser('admin', ['status' => false]);

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk();

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Changed Name',
                'email' => $user->email,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => $user->name,
            'status' => false,
        ]);
    }

    public function test_blocked_users_can_log_out(): void
    {
        $user = $this->createUser('shop_clerk', ['status' => false]);

        $this->actingAs($user)
            ->post(route('logout'))
            ->assertRedirect();

        $this->assertGuest();
    }

    public function test_only_super_admins_can_change_user_roles_and_statuses(): void
    {
        $admin = $this->createUser('admin');
        $target = $this->createUser('shop_clerk');

        $this->actingAs($admin)
            ->put(route('users.update', $target), ['role_id' => $this->role('factory_clerk')->id])
            ->assertForbidden();

        $this->actingAs($admin)
            ->put(route('users.status', $target), ['status' => false])
            ->assertForbidden();

        $this->assertTrue($target->fresh()->hasRole('shop_clerk'));
        $this->assertTrue($target->fresh()->status);
    }

    public function test_super_admin_can_change_roles_and_blocked_users_retain_read_only_access(): void
    {
        $superAdmin = $this->createUser('super_admin');
        $target = $this->createUser('shop_clerk');

        $this->actingAs($superAdmin)
            ->put(route('users.update', $target), ['role_id' => $this->role('factory_clerk')->id])
            ->assertRedirect();

        $this->assertTrue($target->fresh()->hasRole('factory_clerk'));

        $this->actingAs($superAdmin)
            ->put(route('users.status', $target), ['status' => false])
            ->assertRedirect();

        $target = $target->fresh();
        $this->assertFalse($target->status);

        $this->actingAs($target)
            ->get(route('profile.edit'))
            ->assertOk();

        $this->actingAs($target)
            ->patch(route('profile.update'), [
                'name' => 'Changed Name',
                'email' => $target->email,
            ])
            ->assertForbidden();

        $this->actingAs($superAdmin)
            ->put(route('users.status', $target), ['status' => true])
            ->assertRedirect();

        $this->assertTrue($target->fresh()->status);
    }

    public function test_super_admin_cannot_change_own_role_or_status(): void
    {
        $superAdmin = $this->createUser('super_admin');

        $this->actingAs($superAdmin)
            ->from(route('employees.index'))
            ->put(route('users.update', $superAdmin), ['role_id' => $this->role('admin')->id])
            ->assertSessionHasErrors('role_id');

        $this->actingAs($superAdmin)
            ->from(route('employees.index'))
            ->put(route('users.status', $superAdmin), ['status' => false])
            ->assertSessionHasErrors('status');

        $this->assertTrue($superAdmin->fresh()->hasRole('super_admin'));
        $this->assertTrue($superAdmin->fresh()->status);
    }

    public function test_super_admin_can_change_other_super_admins_and_remain_active(): void
    {
        $actor = $this->createUser('super_admin');
        $duplicateSuperAdminRole = Role::query()->create(['name' => 'super_admin']);
        $demotedSuperAdmin = User::factory()->create(['role_id' => $duplicateSuperAdminRole->id]);
        $blockedSuperAdmin = User::factory()->create(['role_id' => $duplicateSuperAdminRole->id]);

        $this->actingAs($actor)
            ->put(route('users.update', $demotedSuperAdmin), [
                'role_id' => $this->role('admin')->id,
            ])
            ->assertRedirect();

        $this->actingAs($actor)
            ->put(route('users.status', $blockedSuperAdmin), ['status' => false])
            ->assertRedirect();

        $this->assertTrue($actor->fresh()->hasRole('super_admin'));
        $this->assertTrue($actor->fresh()->status);
        $this->assertTrue($demotedSuperAdmin->fresh()->hasRole('admin'));
        $this->assertFalse($blockedSuperAdmin->fresh()->status);
    }

    public function test_last_active_super_admin_cannot_delete_their_account(): void
    {
        $superAdmin = $this->createUser('super_admin');

        $this->actingAs($superAdmin)
            ->from(route('profile.edit'))
            ->delete(route('profile.destroy'), ['password' => 'password'])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
    }

    public function test_admin_cannot_create_another_super_admin(): void
    {
        $admin = $this->createUser('admin');
        $superAdminRole = $this->role('super_admin');

        $this->actingAs($admin)
            ->from(route('register'))
            ->post(route('register.store'), [
                'name' => 'Escalated User',
                'email' => 'escalated@example.com',
                'password' => 'password',
                'password_confirmation' => 'password',
                'role_id' => $superAdminRole->id,
            ])
            ->assertSessionHasErrors('role_id');

        $this->assertDatabaseMissing('users', ['email' => 'escalated@example.com']);
    }

    public function test_first_registered_user_becomes_the_super_admin(): void
    {
        $this->get(route('register'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('auth/register')
                ->where('roles.0.name', 'super_admin'));

        $this->post(route('register.store'), [
            'name' => 'First Admin',
            'email' => 'first-admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $user = User::query()->where('email', 'first-admin@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('super_admin'));
        $this->assertTrue($user->status);
        $this->assertAuthenticatedAs($user);
    }

    private function createUser(string $roleName, array $attributes = []): User
    {
        $status = $attributes['status'] ?? true;
        unset($attributes['status']);

        $user = User::factory()->create([
            'role_id' => $this->role($roleName)->id,
            ...$attributes,
        ]);
        $user->status = $status;
        $user->save();

        return $user;
    }

    private function role(string $name): Role
    {
        return Role::query()->firstOrCreate(['name' => $name]);
    }
}

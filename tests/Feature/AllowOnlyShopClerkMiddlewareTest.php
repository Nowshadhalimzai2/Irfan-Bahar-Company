<?php

namespace Tests\Feature;

use App\Http\Middleware\onlyshopclerk;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AllowOnlyShopClerkMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_clerk_can_access_the_toggle_route(): void
    {
        $role = Role::create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->actingAs($user);

        $request = Request::create('/expenses/1/toggle-editable', 'PUT');
        $middleware = new onlyshopclerk();

        $response = $middleware->handle($request, function ($request) {
            return response()->json(['ok' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }
}

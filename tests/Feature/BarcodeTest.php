<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BarcodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_text_barcode_can_be_rendered_as_an_svg(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->get(route('barcode.image', ['value' => 'SP-1A']));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/svg+xml');
        $this->assertStringContainsString('<svg', $response->getContent());
    }

    public function test_barcode_svg_can_be_downloaded(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->get(route('barcode.image', [
            'value' => 'SP-1A',
            'download' => 1,
        ]));

        $response->assertOk();
        $response->assertHeader('Content-Disposition', 'attachment; filename="barcode-SP-1A.svg"');
    }

    private function verifiedUser(): User
    {
        $role = Role::create(['name' => 'admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }
}

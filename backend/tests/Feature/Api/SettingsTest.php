<?php

namespace Tests\Feature\Api;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_settings(): void
    {
        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'formatted',
            ]);
    }

    public function test_can_update_and_fetch_setting(): void
    {
        $this->postJson('/api/settings', [
            'settings' => [
                'tax_rate' => '15.00',
            ],
        ])->assertOk();

        $this->assertSame(15.0, Setting::get('tax_rate'));

        $this->getJson('/api/settings/tax_rate')
            ->assertOk()
            ->assertJson([
                'key' => 'tax_rate',
                'value' => 15.0,
            ]);
    }
}


<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        $settings = Setting::all();
        
        // Format for easier frontend consumption
        $formattedSettings = [];
        foreach ($settings as $setting) {
            $formattedSettings[$setting->key] = [
                'value' => $setting->value,
                'type' => $setting->type,
                'label' => $setting->label,
                'description' => $setting->description,
            ];
        }

        return response()->json([
            'data' => $settings,
            'formatted' => $formattedSettings,
        ]);
    }

    /**
     * Update multiple settings
     */
    public function update(Request $request)
    {
        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => Setting::all(),
        ]);
    }

    /**
     * Get a single setting
     */
    public function show($key)
    {
        $value = Setting::get($key);
        
        return response()->json([
            'key' => $key,
            'value' => $value,
        ]);
    }
}

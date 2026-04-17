<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Beverages', 'description' => 'Cold drinks, juices, and beverages'],
            ['name' => 'Snacks', 'description' => 'Chips, cookies, and snacks'],
            ['name' => 'Dairy', 'description' => 'Milk, cheese, and dairy products'],
            ['name' => 'Bakery', 'description' => 'Bread, cakes, and baked goods'],
            ['name' => 'Fruits & Vegetables', 'description' => 'Fresh produce'],
            ['name' => 'Meat & Seafood', 'description' => 'Fresh meat and seafood'],
            ['name' => 'Frozen Foods', 'description' => 'Frozen items'],
            ['name' => 'Canned Goods', 'description' => 'Canned and preserved food'],
            ['name' => 'Household', 'description' => 'Cleaning and household supplies'],
            ['name' => 'Personal Care', 'description' => 'Personal hygiene products'],
            ['name' => 'Stationery', 'description' => 'Office and school supplies'],
            ['name' => 'Electronics', 'description' => 'Small electronic items'],
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
                'is_active' => true,
            ]);
        }
    }
}
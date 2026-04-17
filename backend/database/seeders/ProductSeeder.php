<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all()->keyBy('slug');

        $products = [
            // Beverages
            ['name' => 'Coca Cola 500ml', 'sku' => 'BEV001', 'barcode' => '8901234567890', 'price' => 40.00, 'stock' => 100, 'category' => 'beverages', 'reorder' => 20],
            ['name' => 'Pepsi 500ml', 'sku' => 'BEV002', 'barcode' => '8901234567891', 'price' => 40.00, 'stock' => 80, 'category' => 'beverages', 'reorder' => 20],
            ['name' => 'Sprite 500ml', 'sku' => 'BEV003', 'barcode' => '8901234567892', 'price' => 40.00, 'stock' => 60, 'category' => 'beverages', 'reorder' => 20],
            ['name' => 'Mountain Dew 500ml', 'sku' => 'BEV004', 'barcode' => '8901234567893', 'price' => 40.00, 'stock' => 50, 'category' => 'beverages', 'reorder' => 20],
            ['name' => 'Minute Maid Orange Juice 1L', 'sku' => 'BEV005', 'barcode' => '8901234567894', 'price' => 85.00, 'stock' => 40, 'category' => 'beverages', 'reorder' => 15],
            ['name' => 'Red Bull Energy Drink 250ml', 'sku' => 'BEV006', 'barcode' => '8901234567895', 'price' => 125.00, 'stock' => 30, 'category' => 'beverages', 'reorder' => 10],

            // Snacks
            ['name' => 'Lays Classic 52g', 'sku' => 'SNK001', 'barcode' => '8901234567896', 'price' => 20.00, 'stock' => 150, 'category' => 'snacks', 'reorder' => 30],
            ['name' => 'Kurkure Masala Munch 85g', 'sku' => 'SNK002', 'barcode' => '8901234567897', 'price' => 20.00, 'stock' => 120, 'category' => 'snacks', 'reorder' => 30],
            ['name' => 'Parle-G Biscuits 150g', 'sku' => 'SNK003', 'barcode' => '8901234567898', 'price' => 15.00, 'stock' => 200, 'category' => 'snacks', 'reorder' => 40],
            ['name' => 'Oreo Cookies 120g', 'sku' => 'SNK004', 'barcode' => '8901234567899', 'price' => 30.00, 'stock' => 90, 'category' => 'snacks', 'reorder' => 25],
            ['name' => 'Britannia Good Day Cookies 100g', 'sku' => 'SNK005', 'barcode' => '8901234567900', 'price' => 25.00, 'stock' => 110, 'category' => 'snacks', 'reorder' => 30],

            // Dairy
            ['name' => 'Amul Milk 1L', 'sku' => 'DAI001', 'barcode' => '8901234567901', 'price' => 60.00, 'stock' => 80, 'category' => 'dairy', 'reorder' => 25],
            ['name' => 'Amul Butter 100g', 'sku' => 'DAI002', 'barcode' => '8901234567902', 'price' => 55.00, 'stock' => 60, 'category' => 'dairy', 'reorder' => 15],
            ['name' => 'Amul Cheese Slices 200g', 'sku' => 'DAI003', 'barcode' => '8901234567903', 'price' => 140.00, 'stock' => 40, 'category' => 'dairy', 'reorder' => 10],
            ['name' => 'Nestle Dahi 400g', 'sku' => 'DAI004', 'barcode' => '8901234567904', 'price' => 35.00, 'stock' => 50, 'category' => 'dairy', 'reorder' => 15],
            ['name' => 'Mother Dairy Paneer 200g', 'sku' => 'DAI005', 'barcode' => '8901234567905', 'price' => 90.00, 'stock' => 30, 'category' => 'dairy', 'reorder' => 10],

            // Bakery
            ['name' => 'White Bread Loaf 400g', 'sku' => 'BAK001', 'barcode' => '8901234567906', 'price' => 35.00, 'stock' => 50, 'category' => 'bakery', 'reorder' => 15],
            ['name' => 'Brown Bread Loaf 400g', 'sku' => 'BAK002', 'barcode' => '8901234567907', 'price' => 45.00, 'stock' => 40, 'category' => 'bakery', 'reorder' => 15],
            ['name' => 'Croissant Pack of 4', 'sku' => 'BAK003', 'barcode' => '8901234567908', 'price' => 80.00, 'stock' => 25, 'category' => 'bakery', 'reorder' => 10],
            ['name' => 'Chocolate Muffin', 'sku' => 'BAK004', 'barcode' => '8901234567909', 'price' => 40.00, 'stock' => 30, 'category' => 'bakery', 'reorder' => 10],

            // Fruits & Vegetables
            ['name' => 'Banana (per dozen)', 'sku' => 'FRU001', 'barcode' => '8901234567910', 'price' => 48.00, 'stock' => 20, 'category' => 'fruits-vegetables', 'reorder' => 10],
            ['name' => 'Apple (per kg)', 'sku' => 'FRU002', 'barcode' => '8901234567911', 'price' => 160.00, 'stock' => 15, 'category' => 'fruits-vegetables', 'reorder' => 8],
            ['name' => 'Tomato (per kg)', 'sku' => 'VEG001', 'barcode' => '8901234567912', 'price' => 30.00, 'stock' => 25, 'category' => 'fruits-vegetables', 'reorder' => 10],
            ['name' => 'Onion (per kg)', 'sku' => 'VEG002', 'barcode' => '8901234567913', 'price' => 35.00, 'stock' => 30, 'category' => 'fruits-vegetables', 'reorder' => 10],
            ['name' => 'Potato (per kg)', 'sku' => 'VEG003', 'barcode' => '8901234567914', 'price' => 25.00, 'stock' => 40, 'category' => 'fruits-vegetables', 'reorder' => 15],

            // Household
            ['name' => 'Vim Dishwash Bar 200g', 'sku' => 'HOU001', 'barcode' => '8901234567915', 'price' => 25.00, 'stock' => 80, 'category' => 'household', 'reorder' => 20],
            ['name' => 'Surf Excel Detergent 1kg', 'sku' => 'HOU002', 'barcode' => '8901234567916', 'price' => 180.00, 'stock' => 50, 'category' => 'household', 'reorder' => 15],
            ['name' => 'Harpic Toilet Cleaner 500ml', 'sku' => 'HOU003', 'barcode' => '8901234567917', 'price' => 85.00, 'stock' => 40, 'category' => 'household', 'reorder' => 10],
            ['name' => 'Lizol Floor Cleaner 500ml', 'sku' => 'HOU004', 'barcode' => '8901234567918', 'price' => 95.00, 'stock' => 35, 'category' => 'household', 'reorder' => 10],

            // Personal Care
            ['name' => 'Colgate Toothpaste 150g', 'sku' => 'PER001', 'barcode' => '8901234567919', 'price' => 85.00, 'stock' => 100, 'category' => 'personal-care', 'reorder' => 25],
            ['name' => 'Dove Soap 100g', 'sku' => 'PER002', 'barcode' => '8901234567920', 'price' => 45.00, 'stock' => 120, 'category' => 'personal-care', 'reorder' => 30],
            ['name' => 'Head & Shoulders Shampoo 180ml', 'sku' => 'PER003', 'barcode' => '8901234567921', 'price' => 195.00, 'stock' => 60, 'category' => 'personal-care', 'reorder' => 15],
            ['name' => 'Dettol Hand Sanitizer 200ml', 'sku' => 'PER004', 'barcode' => '8901234567922', 'price' => 75.00, 'stock' => 80, 'category' => 'personal-care', 'reorder' => 20],

            // Stationery
            ['name' => 'Classmate Notebook 172 Pages', 'sku' => 'STA001', 'barcode' => '8901234567923', 'price' => 45.00, 'stock' => 70, 'category' => 'stationery', 'reorder' => 20],
            ['name' => 'Reynolds Pen Pack of 10', 'sku' => 'STA002', 'barcode' => '8901234567924', 'price' => 50.00, 'stock' => 50, 'category' => 'stationery', 'reorder' => 15],
            ['name' => 'Apsara Pencils Pack of 10', 'sku' => 'STA003', 'barcode' => '8901234567925', 'price' => 30.00, 'stock' => 60, 'category' => 'stationery', 'reorder' => 15],

            // Electronics
            ['name' => 'Duracell AA Batteries Pack of 4', 'sku' => 'ELE001', 'barcode' => '8901234567926', 'price' => 120.00, 'stock' => 45, 'category' => 'electronics', 'reorder' => 15],
            ['name' => 'USB Cable Type-C 1m', 'sku' => 'ELE002', 'barcode' => '8901234567927', 'price' => 150.00, 'stock' => 35, 'category' => 'electronics', 'reorder' => 10],
        ];

        foreach ($products as $productData) {
            $categorySlug = $productData['category'];
            $category = $categories->get($categorySlug);

            Product::create([
                'name' => $productData['name'],
                'sku' => $productData['sku'],
                'barcode' => $productData['barcode'],
                'description' => 'Quality product from ' . ($category ? $category->name : 'store'),
                'price' => $productData['price'],
                'stock_quantity' => $productData['stock'],
                'reorder_level' => $productData['reorder'],
                'is_active' => true,
                'category_id' => $category ? $category->id : null,
            ]);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CustomerController extends Controller
{
    private const CACHE_VERSION_KEY = 'customers.list.version';

    private static function customerListVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    public static function bumpCustomerCacheVersion(): void
    {
        if (!Cache::has(self::CACHE_VERSION_KEY)) {
            Cache::forever(self::CACHE_VERSION_KEY, 1);
        }

        Cache::increment(self::CACHE_VERSION_KEY);
    }

    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 25);
        $search = $request->input('search');
        
        $query = Customer::query()
            ->withCount('sales')
            ->withCount(['sales as total_purchases'])
            ->withSum('sales as total_spent', 'total_amount')
            ->orderByDesc('total_spent');
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('address', 'LIKE', "%{$search}%");
            });
        }
        
        $customers = $query->paginate($perPage);
        
        return CustomerResource::collection($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create($request->all());
        self::bumpCustomerCacheVersion();

        return new CustomerResource($customer);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer)
    {
        $customer->load('sales')
            ->loadCount('sales')
            ->loadCount(['sales as total_purchases'])
            ->loadSum('sales as total_spent', 'total_amount');

        return new CustomerResource($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'string|max:255',
            'email' => 'nullable|email|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer->update($request->all());
        
        self::bumpCustomerCacheVersion();

        return new CustomerResource($customer);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();
        
        self::bumpCustomerCacheVersion();
        
        return response()->json(['message' => 'Customer deleted successfully']);
    }
}

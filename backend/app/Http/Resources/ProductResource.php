<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'price' => (float) $this->price,
            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,
            'category_id' => $this->category_id ?? null,
            'category' => $this->whenLoaded('category'),
            'barcode' => $this->barcode ?? null,
            'reorder_level' => $this->reorder_level ?? 10,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
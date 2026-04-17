<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
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
            'sale_id' => $this->sale_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', function () {
                return [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'sku' => $this->product->sku,
                ];
            }),
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'line_item_total' => (float) $this->line_item_total,
            'line_item_tax' => (float) $this->line_item_tax,
            'line_item_discount' => (float) $this->line_item_discount,
        ];
    }
}
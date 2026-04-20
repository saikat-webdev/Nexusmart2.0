<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnResource extends JsonResource
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
            'sale_item_id' => $this->sale_item_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn() => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ]),
            'quantity' => $this->quantity,
            'refund_amount' => (float) $this->refund_amount,
            'reason' => $this->reason,
            'status' => $this->status,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'order_number' => $this->order_number,
            'customer_id'  => $this->customer_id,
            'user_id'      => $this->user_id,
            'status'       => $this->status,
            'total_amount' => (float) $this->total_amount,
            'notes'        => $this->notes,
            'created_at'   => $this->created_at?->toISOString(),
            'updated_at'   => $this->updated_at?->toISOString(),
            'customer'     => new CustomerResource($this->whenLoaded('customer')),
            'user'         => new UserResource($this->whenLoaded('user')),
            'items'        => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}

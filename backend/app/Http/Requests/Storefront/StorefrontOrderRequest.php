<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StorefrontOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public guest / customer checkout
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'string', 'email', 'max:255'],
            'phone'              => ['nullable', 'string', 'max:50'],
            'address'            => ['required', 'string', 'max:1000'],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'   => ['required', 'integer', 'min:1'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ];
    }
}

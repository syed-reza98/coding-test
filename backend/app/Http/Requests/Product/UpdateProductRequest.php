<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');
        $productId = $product instanceof \App\Models\Product ? $product->id : $product;

        return [
            'name'           => ['sometimes', 'required', 'string', 'max:255'],
            'sku'            => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($productId)],
            'category_id'    => ['nullable', 'integer', 'exists:categories,id'],
            'category'       => ['sometimes', 'required', 'string', 'max:100'],
            'price'          => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock_quantity' => ['sometimes', 'required', 'integer', 'min:0'],
            'status'         => ['sometimes', 'required', 'in:active,inactive'],
        ];
    }
}

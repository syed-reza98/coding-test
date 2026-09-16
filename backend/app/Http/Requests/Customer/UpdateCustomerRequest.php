<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customer = $this->route('customer');
        $customerId = $customer instanceof \App\Models\Customer ? $customer->id : $customer;

        return [
            'name'    => ['sometimes', 'required', 'string', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'email'   => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customerId)],
            'address' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

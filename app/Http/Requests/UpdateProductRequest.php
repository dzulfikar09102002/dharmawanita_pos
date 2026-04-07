<?php

namespace App\Http\Requests;

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
        $id = $this->route('product'); 
        return [
            'category_id'    => 'required|exists:categories,id',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'name')->ignore($id),
            ],
            'brand'          => 'required|string|max:255',
            'purchase_price' => 'required|numeric|min:0|max:9999999999999.99',
            'selling_price'  => 'required|numeric|min:0|max:9999999999999.99',
            'expired_date'   => 'nullable|date|after:today',
        ];
    }
}
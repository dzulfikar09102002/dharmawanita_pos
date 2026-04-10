<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('purchasing_method'); 
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('purchasing_method', 'name')->ignore($id),
            ],
        ];
    }
}
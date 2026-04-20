<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSalesSummaryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
   public function rules(): array
{
    return [
        'date' => ['required', 'date'],
        'total_sales' => ['required', 'numeric', 'min:0'],
        'total_transactions' => ['required', 'integer', 'min:0'],

        'details' => ['required', 'array', 'min:1'],

        'details.*.payment_method_id' => [
            'required',
            'integer',
            'exists:payment_methods,id'
        ],
        'details.*.total_amount' => ['required', 'numeric', 'min:0'],
        'details.*.total_transactions' => ['required', 'integer', 'min:0'],
    ];
}
}

<?php

namespace App\Http\Requests;

use App\Helpers\Constants\ActionConstants;
use App\Helpers\Constants\PageNameConstants;

class StoreProductRequest extends BaseRequest
{
    protected $page = PageNameConstants::ProductMenu;
    protected $action = ActionConstants::StoreAction;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'has_expired' => 'required|boolean',
        ];
    }
}

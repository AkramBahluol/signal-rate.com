<?php

namespace App\Http\Requests;

use App\Enums\PlanType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class MobilePlanIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country' => ['nullable', 'string', 'max:3'],
            'operator' => ['nullable', 'string', 'max:80'],
            'q' => ['nullable', 'string', 'max:100'],
            'price_min' => ['nullable', 'numeric', 'min:0'], 'price_max' => ['nullable', 'numeric', 'min:0'],
            'data_min' => ['nullable', 'integer', 'min:0'], 'unlimited' => ['nullable', 'boolean'],
            '5g' => ['nullable', 'boolean'], 'esim' => ['nullable', 'boolean'],
            'plan_type' => ['nullable', Rule::enum(PlanType::class)],
            'contract_length' => ['nullable', 'integer', 'min:0', 'max:120'],
            'sort' => ['nullable', Rule::in(['cheapest', 'most_data', 'cost_per_gb', 'shortest_contract', 'newest'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->filled('price_min') && $this->filled('price_max') && (float) $this->input('price_max') < (float) $this->input('price_min')) {
                $validator->errors()->add('price_max', 'The maximum price must be greater than or equal to the minimum price.');
            }
        }];
    }
}

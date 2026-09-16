<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsufficientStockException extends Exception
{
    protected array $details;

    public function __construct(string $message = "Insufficient stock available.", array $details = [], int $code = 409)
    {
        parent::__construct($message, $code);
        $this->details = $details;
    }

    public function getDetails(): array
    {
        return $this->details;
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error'   => 'OUT_OF_STOCK',
            'message' => $this->getMessage(),
            'details' => $this->details,
        ], 409);
    }
}

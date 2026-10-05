<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $route = $request->user()?->hasRole('factory_clerk') ? 'factory' : 'dashboard';

        return redirect()->route($route);
    }
}

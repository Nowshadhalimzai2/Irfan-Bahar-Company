<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockWritesForInactiveUsers
{
    /**
     * Prevent blocked accounts from changing application data while preserving read access.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->status && ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && ! $request->routeIs('logout')) {
            abort(403, 'اکونت شما فقط دسترسی خواندن دارد.');
        }

        return $next($request);
    }
}

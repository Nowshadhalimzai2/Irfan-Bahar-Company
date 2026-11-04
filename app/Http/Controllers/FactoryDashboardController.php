<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FactoryDashboardService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FactoryDashboardController extends Controller
{
    public function __invoke(Request $request, FactoryDashboardService $dashboardService): Response
    {   $user= Auth::user();
        Gate::allowIf(($user instanceof User && $user->hasAnyRole(['factory_clerk','admin','super_admin'])),'you cannot access this page' );
        $filters = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date', 'before_or_equal:today'],
        ]);

        $timezone = config('app.timezone');
        $endDate = CarbonImmutable::parse($filters['end_date'] ?? now($timezone)->toDateString(), $timezone);
        $startDate = CarbonImmutable::parse(
            $filters['start_date'] ?? $endDate->subDays(6)->toDateString(),
            $timezone,
        );

        if ($startDate->greaterThan($endDate)) {
            throw ValidationException::withMessages([
                'end_date' => 'The dashboard end date must be on or after the start date.',
            ]);
        }

        if ($startDate->diffInDays($endDate) > FactoryDashboardService::MAX_DATE_RANGE_DAYS) {
            throw ValidationException::withMessages([
                'start_date' => 'The dashboard date range cannot exceed 31 days.',
            ]);
        }

        $user = $request->user();
        abort_unless($user instanceof User, 403);
        // Gate::authorize('allow-factory_clerk');

        return Inertia::render('factory/home', $dashboardService->dashboard($user, $startDate, $endDate));
    }
}

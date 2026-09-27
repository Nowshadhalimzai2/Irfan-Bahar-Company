<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Gate::define('manage-users', function (?User $user): bool {
            if (! User::query()->exists()) {
                return true;
            }
            if (! $user->status) {
                abort(403, 'اکونت شما بلاک شده. برای معلومات بیشتر با سوپر ادمین با تماس شوید');
            }

            return $user instanceof User && $user->hasAnyRole(['admin', 'super_admin']);
        });
        Gate::define('allow-shop-clerk', function (?User $user): bool {
            if (! User::query()->exists()) {
                return true;
            }
            if (! $user->status) {
                abort(403, 'اکونت شما بلاک شده. برای معلومات بیشتر با سوپر ادمین با تماس شوید');
            }

            return $user instanceof User && $user->hasRole('shop_clerk');
        });
        Gate::define('reject-admins', function (?User $user): bool {
            if (! User::query()->exists()) {
                return true;
            }
            if (! $user->status) {
                abort(403, 'اکونت شما بلاک شده. برای معلومات بیشتر با سوپر ادمین با تماس شوید');
            }

            return $user instanceof User && $user->hasAnyRole(['shop_clerk','factory_clerk']);
        });
        Gate::define('allow-factory_clerk', function (?User $user): bool {
            if (! User::query()->exists()) {
                return true;
            }
            if (! $user->status) {
                abort(403, 'اکونت شما بلاک شده. برای معلومات بیشتر با سوپر ادمین با تماس شوید');
            }

            return $user instanceof User && $user->hasAnyRole(['factory_clerk']);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): ?Password => app()->isProduction()
                ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
                : null,
        );
    }
}

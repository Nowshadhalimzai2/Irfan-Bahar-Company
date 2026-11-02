<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('items', 'code')) {
            Schema::table('items', function (Blueprint $table): void {
                // Nullable is required for a safe ALTER on existing SQLite
                // databases; every existing and newly-created item is filled
                // below/application-side.
                $table->string('code', 20)->nullable();
            });
        }

        if (! Schema::hasIndex('items', 'items_code_unique')) {
            Schema::table('items', function (Blueprint $table): void {
                $table->unique('code', 'items_code_unique');
            });
        }

        DB::table('items')
            ->leftJoin('categories', 'categories.id', '=', 'items.category_id')
            ->select('items.id', 'categories.name as category_name')
            ->orderBy('items.id')
            ->get()
            ->each(function (object $item): void {
                $prefix = $this->categoryPrefix((string) ($item->category_name ?? ''));
                $code = $prefix . '-' . str_pad((string) $item->id, 4, '0', STR_PAD_LEFT);

                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['code' => $code]);
            });

        // Move old generated unit codes out of the way before assigning the
        // new readable codes under the existing unique constraint.
        DB::table('item_units')->orderBy('id')->get()->each(function (object $unit): void {
            DB::table('item_units')
                ->where('id', $unit->id)
                ->update(['code' => 'MIG-UNIT-' . $unit->id]);
        });

        DB::table('items')->orderBy('id')->get()->each(function (object $item): void {
            $units = DB::table('item_units')
                ->where('item_id', $item->id)
                ->orderByRaw('case when id = ? then 0 else 1 end', [$item->base_unit_id])
                ->orderBy('id')
                ->get();

            foreach ($units as $index => $unit) {
                $code = (string) $item->code;
                if ($index > 0) {
                    $code .= '-U' . ($index + 1);
                }

                DB::table('item_units')
                    ->where('id', $unit->id)
                    ->update(['code' => $code]);
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasIndex('items', 'items_code_unique')) {
            Schema::table('items', function (Blueprint $table): void {
                $table->dropUnique('items_code_unique');
            });
        }

        if (Schema::hasColumn('items', 'code')) {
            Schema::table('items', function (Blueprint $table): void {
                $table->dropColumn('code');
            });
        }
    }

    private function categoryPrefix(string $category): string
    {
        return match (Str::lower(trim($category))) {
            'soap' => 'SP',
            'powder' => 'PDR',
            'vaseline' => 'VSL',
            'shampoo' => 'SMP',
            'raw_material', 'raw_materail' => 'RM',
            'acid', 'asid' => 'ACD',
            'packing' => 'PKN',
            default => Str::upper(Str::substr(trim($category) ?: 'OTH', 0, 3)),
        };
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('f_name', 255);
            $table->string('phone', 10);
            $table->text('address');
            $table->enum('position', ['clerk', 'shopkeeper', 'worker', 'machine_operator', 'other']);
            $table->enum('shift', ['day', 'night']);
            $table->decimal('salary', 6, 2);
            $table->date('recruitment_date');
            $table->boolean('status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};

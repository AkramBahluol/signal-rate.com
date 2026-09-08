<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class ErrorEntry extends Model
{
    protected $table = 'errors';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['managed_by_import' => 'boolean', 'last_verified_at' => 'datetime'];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(ErrorFamily::class, 'family_id');
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(ErrorAlias::class, 'error_id');
    }

    public function causes(): HasMany
    {
        return $this->hasMany(ErrorCause::class, 'error_id')->orderBy('position');
    }

    public function solutions(): HasMany
    {
        return $this->hasMany(ErrorSolution::class, 'error_id')->orderBy('position');
    }

    public function examples(): HasMany
    {
        return $this->hasMany(ErrorExample::class, 'error_id');
    }

    public function sources(): HasMany
    {
        return $this->hasMany(ErrorSource::class, 'error_id');
    }

    public function related(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'error_relations', 'error_id', 'related_error_id')->withPivot(['type', 'note']);
    }

    public function scopePublic($query)
    {
        return $query->whereIn('status', ['published', 'deprecated'])
            ->where('verification_status', 'verified')
            ->whereNotNull('last_verified_at');
    }
}

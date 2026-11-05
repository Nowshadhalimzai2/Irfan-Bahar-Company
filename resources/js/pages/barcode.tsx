import { Head } from '@inertiajs/react';
import { Download, Package, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getDariItemType, getDariItemUnit } from '@/components/location-translator';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import './barcode.css';

type UnitBarcode = {
    id: number;
    item_id: number;
    item_name: string;
    item_code: string | null;
    item_sku: string | null;
    item_type: 'product' | 'raw_material' | 'packing';
    category: string | null;
    product_weight: number | null;
    unit_name: string;
    unit_symbol: string | null;
    base_unit_name: string | null;
    base_unit_symbol: string | null;
    conversion_to_base: number;
    barcode: string;
    is_active: boolean;
};

interface Props {
    units: UnitBarcode[];
    missingBarcodeCount: number;
}

export default function Barcode({ units, missingBarcodeCount }: Props) {
    const [search, setSearch] = useState('');
    const [copies, setCopies] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(units[0]?.id ?? null);
    const filteredUnits = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();

        if (!query) {
            return units;
        }

        return units.filter((unit) =>
            [
                unit.item_name,
                unit.item_code,
                unit.item_sku,
                unit.unit_name,
                unit.unit_symbol,
                unit.barcode,
                unit.category,
            ].some((value) => value?.toLocaleLowerCase().includes(query)),
        );
    }, [units, search]);
    const selectedUnit = units.find((unit) => unit.id === selectedId) ?? null;
    const barcodeUrl = selectedUnit
        ? `/barcode/image?value=${encodeURIComponent(selectedUnit.barcode)}`
        : null;
    const itemCode = selectedUnit?.item_code || selectedUnit?.item_sku || 'بدون کد جنس';
    const unitLabel = selectedUnit
        ? selectedUnit.unit_symbol || getDariItemUnit(selectedUnit.unit_name)
        : '';
    const baseUnitLabel = selectedUnit
        ? selectedUnit.base_unit_symbol ||
          (selectedUnit.base_unit_name
              ? getDariItemUnit(selectedUnit.base_unit_name)
              : '')
        : '';

    return (
        <AppLayout
            breadcrumbs={[{ title: 'بارکود', href: '/barcode' }]}
        >
            <Head title="بارکود واحدهای جنس" />

            <main className="barcode-page mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8" dir='rtl'>
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <p className="text-sm font-semibold text-emerald-700">مدیریت جنس‌ها</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-normal">بارکود واحدهای جنس</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            جستجو، چاپ یا دریافت بارکود هر واحد فعال جنس
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                        <Package className="size-4 text-emerald-700" aria-hidden="true" />
                        <span>{units.length} واحد دارای بارکود</span>
                    </div>
                </header>

                {missingBarcodeCount > 0 && (
                    <div className="border-s-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        برای {missingBarcodeCount} واحد فعال هنوز بارکود ثبت نشده است.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
                    <section className="min-w-0 border-y border-border py-4 lg:border-t-0">
                        <label htmlFor="barcode-search" className="mb-2 block text-sm font-semibold">
                            انتخاب جنس و واحد
                        </label>
                        <div className="relative mb-3">
                            <Search
                                className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                id="barcode-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="نام، کد، واحد یا بارکود را جستجو کنید"
                                className="h-10 w-full rounded-md border border-input bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="max-h-112 space-y-1 overflow-y-auto" aria-label="واحدهای جنس">
                            {filteredUnits.map((unit) => (
                                <button
                                    key={unit.id}
                                    type="button"
                                    onClick={() => setSelectedId(unit.id)}
                                    aria-pressed={selectedId === unit.id}
                                    className={`w-full rounded-md border px-3 py-3 text-start transition-colors ${selectedId === unit.id ? 'border-emerald-700 bg-emerald-50' : 'border-transparent hover:border-border hover:bg-muted/60'}`}
                                >
                                    <span className="block truncate text-sm font-semibold">
                                        {unit.item_name} · {unit.unit_symbol || getDariItemUnit(unit.unit_name)}
                                    </span>
                                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                                        {unit.item_code || unit.item_sku || 'بدون کد جنس'} · {unit.barcode}
                                    </span>
                                </button>
                            ))}
                            {filteredUnits.length === 0 && (
                                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                                    واحد دارای بارکود پیدا نشد.
                                </p>
                            )}
                        </div>
                    </section>

                    {selectedUnit && barcodeUrl ? (
                        <section className="min-w-0 space-y-5" aria-label="پیش‌نمایش بارکود">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="wrap-break-word text-xl font-bold">{selectedUnit.item_name}</h2>
                                    <p className="mt-1 text-sm font-medium">
                                        واحد: {selectedUnit.unit_symbol || getDariItemUnit(selectedUnit.unit_name)}
                                    </p>
                                    <p className="mt-1 font-mono text-sm text-muted-foreground">{itemCode}</p>
                                </div>
                                <div className="no-print flex shrink-0 gap-2">
                                    <Button asChild variant="outline" aria-label="دریافت فایل بارکود">
                                        <a href={`${barcodeUrl}&download=1`} download>
                                            <Download aria-hidden="true" />
                                            دریافت SVG
                                        </a>
                                    </Button>
                                    <Button type="button" onClick={() => window.print()} aria-label="چاپ بارکود">
                                        <Printer aria-hidden="true" />
                                        چاپ
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-x-6 gap-y-3 border-y border-border py-4 sm:grid-cols-2">
                                <Info label="نوع جنس" value={getDariItemType(selectedUnit.item_type)} />
                                <Info label="دسته‌بندی" value={selectedUnit.category} />
                                <Info label="واحد بارکود" value={unitLabel} />
                                {selectedUnit.item_type === 'product' && (
                                    <Info
                                        label="وزن محصول"
                                        value={selectedUnit.product_weight === null ? null : `${Math.ceil(selectedUnit.product_weight*selectedUnit.conversion_to_base)/1000} N/A`}
                                    />
                                )}
                                <Info
                                    label="معادل واحد پایه"
                                    value={
                                        selectedUnit.base_unit_name
                                            ? `۱ ${unitLabel} = ${selectedUnit.conversion_to_base} ${baseUnitLabel}`
                                            : null
                                    }
                                />
                            </div>

                            <div className="no-print flex items-center justify-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={copies <= 1}
                                    onClick={() => setCopies((value) => Math.max(1, value - 1))}
                                    aria-label="کاهش تعداد چاپ"
                                >
                                    −
                                </Button>
                                <span aria-live="polite">{copies}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCopies((value) => Math.min(100, value + 1))}
                                    disabled={copies >= 100}
                                    aria-label="افزایش تعداد چاپ"
                                >
                                    +
                                </Button>
                            </div>

                            <div
                                id="printArea"
                                className="barcode-print-area print:grid print:grid-cols-2 h-70 print:h-auto overflow-auto print:overflow-hidden rounded-md border border-border bg-white p-6 text-center text-black sm:p-10"
                            >
                                {Array.from({ length: copies }, (_, index) => (
                                    <div className="mb-5" key={index}>
                                        <p className="barcode-print-name">{selectedUnit.item_name}</p>
                                        <p className="barcode-print-code">
                                            {itemCode} · {selectedUnit.unit_symbol || getDariItemUnit(selectedUnit.unit_name)}
                                        </p>
                                        <img
                                            className="barcode-image mx-auto mt-2 w-full max-w-md"
                                            src={barcodeUrl}
                                            alt={`بارکود ${selectedUnit.item_name}، واحد ${unitLabel}: ${selectedUnit.barcode}`}
                                        />
                                        <p className="mt-2 font-mono text-xs">{selectedUnit.barcode}</p>
                                        <p className="barcode-print-detail">
                                            ۱ {unitLabel} = {selectedUnit.conversion_to_base} {baseUnitLabel}
                                            {selectedUnit.item_type === 'product' && selectedUnit.product_weight !== null
                                                ? ` · ${selectedUnit.product_weight} kg`
                                                : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="flex min-h-72 items-center justify-center border-y border-border text-center text-muted-foreground">
                            <div>
                                <Package className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
                                <p className="mt-3 font-medium">واحد دارای بارکود برای نمایش موجود نیست.</p>
                                {missingBarcodeCount > 0 && (
                                    <p className="mt-1 text-sm">برای واحدهای قدیمی، بارکود را در ویرایش جنس تکمیل کنید.</p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

function Info({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex min-w-0 justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate text-end font-medium">{value || 'ثبت نشده'}</span>
        </div>
    );
}

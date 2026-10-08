import { Head } from '@inertiajs/react';
import { Download, Package, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import './barcode.css';

type Product = {
    id: number;
    name: string;
    code: string | null;
    sku: string | null;
    unit: string | null;
    category: string | null;
    weight: number;
    perPack: number;
    barcode: string;
};

interface Props {
    products: Product[];
    missingBarcodeCount: number;
}

export default function Barcode({ products, missingBarcodeCount }: Props) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(products[0]?.id ?? null);
    const filteredProducts = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();

        if (!query) {
            return products;
        }

        return products.filter((product) =>
            [product.name, product.code, product.sku, product.barcode]
                .some((value) => value?.toLocaleLowerCase().includes(query)),
        );
    }, [products, search]);
    const selectedProduct = products.find((product) => product.id === selectedId) ?? null;
    const barcodeUrl = selectedProduct
        ? `/barcode/image?value=${encodeURIComponent(selectedProduct.barcode)}`
        : null;

    return (
        <AppLayout breadcrumbs={[
            // { title: 'دشبورد', href: dashboard() },
            { title: 'بارکود', href: '/barcode' },
        ]}>
            <Head title="بارکود محصولات" />

            <main className="barcode-page mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <p className="text-sm font-semibold text-emerald-700">مدیریت محصولات</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-normal">بارکود محصولات</h1>
                        <p className="mt-1 text-sm text-muted-foreground">جستجو، چاپ یا دریافت فایل بارکود کالا</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                        <Package className="size-4 text-emerald-700" aria-hidden="true" />
                        <span>{products.length} محصول دارای بارکود</span>
                    </div>
                </header>

                {missingBarcodeCount > 0 && (
                    <div className="border-s-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        برای {missingBarcodeCount} محصول هنوز بارکود ثبت نشده است.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
                    <section className="min-w-0 border-y border-border py-4 lg:border-t-0">
                        <label htmlFor="barcode-search" className="mb-2 block text-sm font-semibold">انتخاب محصول</label>
                        <div className="relative mb-3">
                            <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <input
                                id="barcode-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="نام، کد یا بارکود را جستجو کنید"
                                className="h-10 w-full rounded-md border border-input bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="max-h-112  space-y-1 overflow-y-auto" aria-label="محصولات">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => setSelectedId(product.id)}
                                    aria-pressed={selectedId === product.id}
                                    className={`w-full rounded-md border px-3 py-3 text-start transition-colors ${selectedId === product.id ? 'border-emerald-700 bg-emerald-50' : 'border-transparent hover:border-border hover:bg-muted/60'}`}
                                >
                                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">{product.code || product.sku || 'بدون کد کالا'}</span>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <p className="px-3 py-8 text-center text-sm text-muted-foreground">محصولی پیدا نشد.</p>
                            )}
                        </div>
                    </section>

                    {selectedProduct && barcodeUrl ? (
                        <section className="min-w-0 space-y-5" aria-label="پیش‌نمایش بارکود">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="wrap-break-word text-xl font-bold">{selectedProduct.name}</h2>
                                    <p className="mt-1 font-mono text-sm text-muted-foreground">{selectedProduct.code || selectedProduct.sku || 'بدون کد کالا'}</p>
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
                                <Info label="دسته‌بندی" value={selectedProduct.category} />
                                <Info label="واحد" value={selectedProduct.unit} />
                                <Info label="وزن" value={selectedProduct.weight ? `${selectedProduct.weight} kg` : null} />
                                <Info label="تعداد در بسته" value={String(selectedProduct.perPack)} />
                            </div>

                            <div id="printArea" className="barcode-print-area rounded-md border border-border bg-white p-6 text-center text-black sm:p-10 hidden print:block">
                                
                                {Array.from(([1,2,3,4,5])).map(id=> <>
                                    <p className="barcode-print-name">{selectedProduct.name}</p>
                                    <p className="barcode-print-code">{selectedProduct.code || selectedProduct.sku || ''}</p>
                                    <img className="barcode-image mx-auto mt-5 w-full max-w-md" src={barcodeUrl} alt={`بارکود ${selectedProduct.name}: ${selectedProduct.barcode}`} />
                                    <p className="mt-2 font-mono text-sm tracking-normal">{selectedProduct.barcode}</p>
                                    <p className="barcode-print-detail">{selectedProduct.weight} kg · {selectedProduct.perPack} در بسته</p></>)}
                            </div>
                        </section>
                    ) : (
                        <section className="flex min-h-72 items-center justify-center border-y border-border text-center text-muted-foreground">
                            <div>
                                <Package className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
                                <p className="mt-3 font-medium">محصولی برای نمایش بارکود موجود نیست.</p>
                                {missingBarcodeCount > 0 && <p className="mt-1 text-sm">محصولات بدون بارکود را از بخش ویرایش کالا تکمیل کنید.</p>}
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
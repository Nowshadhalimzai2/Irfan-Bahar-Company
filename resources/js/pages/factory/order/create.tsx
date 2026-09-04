import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, CalendarDays, ClipboardList, Factory, PackagePlus, Sparkles } from 'lucide-react';
import type { FormEvent} from 'react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { getDariItemUnit } from '@/components/location-translator';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';

import type { BOM } from '@/types';
import type { Product } from '@/types/item';

interface Props {
  boms: BOM[];
}

type ProductionOutput = {
  product_id: number | undefined;
  quantity_produced: number;
}

type ProductionOrder = {
  ordered_by: string;
  bom_id: number;
  order_date: string;
  notes?: string;
  productionOutputs: ProductionOutput[];
}


const Create = ({ boms }: Props) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [productionOutput, setProductionOutput] = useState<ProductionOutput[]>([]);
  const [lineError, setLineError] = useState<string | null>(null);


  const { data, setData, errors, post, processing } = useForm<ProductionOrder>({
    'ordered_by': '',
    'bom_id': boms[0].id,
    'order_date': new Date().toISOString().slice(0, 10),
    'notes': '',
    'productionOutputs': [],
  });
  useEffect(() => {
    setData('productionOutputs', productionOutput);
  }, [productionOutput, setData]);

  useEffect(() => {
    async function getRelatedProducts() {
      const selectedBom = boms.find((bom) => bom.id === data.bom_id);

      if (!selectedBom) {
        setRelatedProducts([]);

        return;
      }

      const pds = await axios.get('/factory/production-orders/get-related-products/' + selectedBom.category.id);

      if (pds.status == 200) {
        setRelatedProducts(pds.data);
      } else {
        console.log('error fetching data' + pds.statusText);

      }
    }
    getRelatedProducts();
  }, [boms, data.bom_id]);

  const [currentLine, setCurrentLine] = useState<ProductionOutput>(() => ({
    product_id: relatedProducts[0]?.item_id,
    quantity_produced: 1,
  }));

  const handleOrders = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    post('/factory/production-orders', {
      onFinish: () => {
        setProductionOutput([]);
        setCurrentLine({
          product_id: relatedProducts[0]?.item_id,
          quantity_produced: 1,
        });
      },
    });
  };


  const handleAddLine = () => {
    const productId = currentLine.product_id ?? relatedProducts[0]?.item_id;

    if (!productId || currentLine.quantity_produced <= 0) {
      return;
    }

    // prevent adding the same item twice
    if (productionOutput.some((l) => l.product_id === productId)) {
      setLineError('مقدار از این جنس قبلا تعین شده است');

      return;
    }

    setProductionOutput((prev) => [...prev, { ...currentLine, product_id: productId }]);
    setCurrentLine((prev) => ({
      ...prev,
      quantity_produced: 1,
    }));
    setLineError(null);
  };

  const handleRemoveLine = (index: number) => {
    setProductionOutput((prev) => prev.filter((_, i) => i !== index));
  };

  const itemUnit = useMemo(() => {
    const selectedProduct = relatedProducts.find((product) => product.item_id === (currentLine.product_id ?? relatedProducts[0]?.item_id));

    return selectedProduct?.item.unit ?? 'unit';

  }, [currentLine, relatedProducts]);

  const selectedBom = boms.find((bom) => bom.id === data.bom_id);


  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
      { title: 'لیست سفارش جات', href: '/factory/production-orders' },
      { title: 'سفارش جدید', href: '/factory/production-orders/create' },
    ]}>
      <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 via-background to-background p-3 md:p-6 dark:from-slate-950">
        <section>
          <div className="mx-auto max-w-5xl">
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
              <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-medium text-emerald-300"><Factory className="size-4" /> مرکز عملیات تولید</div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">ثبت سفارش تولید</h1><p className="text-sm text-slate-300">جزئیات سفارش را کامل کنید تا تیم کارخانه بتواند آن را دقیق اجرا کند.</p></div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><ClipboardList className="size-4" /> مرحله ۱ از ۱</div>
              </div>
            </div>
            <form onSubmit={handleOrders} name="orders" id="orders" className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="size-5" /></div><div><h2 className="font-semibold">اطلاعات اصلی سفارش</h2><p className="text-xs text-muted-foreground">مسؤول، فورمول و زمان اجرای سفارش</p></div></div>
                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <div className="grid gap-2">
                      <Label htmlFor="ordered_by">سفارش از طرف <span className="text-destructive">*</span></Label>
                    <Input
                      className="border p-1.5 rounded-md text-sm"
                      tabIndex={2}
                      name="ordered_by"
                      value={data.ordered_by}
                      onChange={(e) =>
                        setData('ordered_by', e.target.value)
                      }
                      placeholder="سفارش توسط که شده؟"
                    />
                    <InputError message={errors.ordered_by} className="mt-2" />
                  </div>

                  <div className="grid gap-2">
                      <Label htmlFor="bom_id">فورمول تولید <span className="text-destructive">*</span></Label>
                    <select
                      className="border p-1.5 rounded-md"
                      tabIndex={2}
                      name="bom_id"
                      value={data.bom_id}
                      onChange={(e) =>
                        setData('bom_id', Number(e.target.value))
                      }
                    >
                      <option value={0}>فورمول را انتخاب کنین</option>
                      {boms.map((bom) => (
                        <option value={bom.id} key={bom.id} >
                          {bom.formula_name}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.bom_id} className="mt-2" />
                    {selectedBom && <p className="rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground">ظرفیت مورد انتظار فورمول: {selectedBom.min_exp_qty} تا {selectedBom.max_exp_qty}</p>}
                  </div>


                    <div className="grid gap-2">
                    <Label htmlFor="order_date">تاریخ سفارش <span className="text-destructive">*</span></Label>
                    <div className="relative"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="order_date" type="date" value={data.order_date} onChange={(e) => setData('order_date', e.target.value)} className="pr-10" /></div>
                    <InputError message={errors.order_date} className="mt-2" />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="notes">نوت</Label>
                    <textarea
                      className="min-h-24 rounded-md border bg-transparent p-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      tabIndex={2}
                      name="notes"
                      value={data.notes}
                      onChange={(e) =>
                        setData('notes', e.target.value)
                      }
                      placeholder="نوت تان اینجا اضافه کنین"
                    />

                    <InputError message={errors.notes} className="mt-2" />
                  </div>
                </div>
              </div>

                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                  <div>
                    <div className="mb-6 flex items-center justify-between gap-3 border-b border-border/60 pb-4"><div><div className="flex items-center gap-2"><PackagePlus className="size-5 text-primary" /><h2 className="font-semibold">محصولات مورد نیاز</h2></div><p className="mt-1 text-xs text-muted-foreground">یک یا چند محصول خروجی را به سفارش اضافه کنید.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{productionOutput.length} محصول</span></div>

                    <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                      <div className="grid gap-2">
                        <Label htmlFor="product_id">جنس که سفارش میشه</Label>
                        <select
                          className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          name="product_id"
                          tabIndex={5}
                          value={currentLine.product_id ?? ''}
                          onChange={(e) =>
                            setCurrentLine((prev) => ({
                              ...prev,
                              product_id: Number(e.target.value),
                            }))
                          }
                        >
                          {relatedProducts.map((product) => (
                            <option value={product.item_id} key={product.item_id}>
                              {product.item.name} {(product.weight / product.per_pack) * 1000}
                            </option>
                          ))}
                        </select>
                        <InputError message={errors.productionOutputs} className="mt-2" />

                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="quantity" className="flex justify-between">
                          <span>  مقدار  </span>
                          <span className="text-sm text-muted-foreground">
                            {currentLine.quantity_produced} {getDariItemUnit(itemUnit)}
                          </span>
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={1}
                          // max={items[currentLine.product_id]}
                          value={currentLine.quantity_produced}
                          onChange={(e) =>
                            setCurrentLine((prev) => ({
                              ...prev,
                              quantity_produced: Number(e.target.value),
                            }))
                          }
                          placeholder="مقدار"
                          className="h-11 rounded-md border bg-background"
                        />
                        <InputError message={errors.productionOutputs} className="mt-2" />

                      </div>


                    </div>

                    <div className="mt-4">
                      <Button
                        type="button"
                        className="w-full gap-2"
                        variant={'outline'}
                        tabIndex={6}
                        onClick={handleAddLine}
                      >
                        <Sparkles className="size-4" /> اضافه کردن محصول
                      </Button>
                    </div>
                    {lineError && <div className="mt-2"><InputError message={lineError} /></div>}
                  </div>
                </section>



                {/* ================================  RESULTS  =============================================== */}
                {productionOutput.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-xl border border-border/70">
                    <div className="bg-muted/50 px-4 py-3 text-sm font-medium">محصولات انتخاب شده</div>
                    <div className="divide-y">
                      {productionOutput.map((line, index) => (
                        <div
                          key={`${line.product_id}-${index}`}
                          className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                              <div className="rounded-lg border bg-background p-3">جنس: {relatedProducts.find((product) => product.item_id === line.product_id)?.item.name || line.product_id}</div>

                              <div className="rounded-lg border bg-background p-3">مقدار: {line.quantity_produced}</div>

                              {/* <div className=" p-5 border rounded-sm bg-white">قیمت واحد: {line.unit_cost}</div> */}

                            </div>
                            {/* <div className="p-5 text-end font-medium">توتل : {line.unit_cost * line.quantity}</div> */}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleRemoveLine(index)}
                          >
                            حذف
                          </Button>
                        </div>
                      ))}
                      <div className="p-3 text-end">
                        <div>
                          {/* {transferLine.reduce((acc, line) => acc += (line.quantity * line.unit_cost), 0)}  :جمله */}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
                  <Link href="/factory/production-orders" className={`${buttonVariants({ variant: 'outline' })} gap-2`}><ArrowLeft className="size-4" /> انصراف</Link>
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-slate-950 hover:bg-slate-800 sm:w-auto"
                    tabIndex={7}
                    data-test="register-employee-button"
                  >
                    {processing && <Spinner />}
                    ثبت سفارش
                  </Button>
                </div>
            </form>
            </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default Create
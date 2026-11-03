import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ClipboardList, Factory, PackagePlus, Sparkles, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { getDariItemUnit } from '@/components/location-translator';
import { formatGregorianDate, parseGregorianDate } from '@/components/persian-date-picker';
import PersionDatePicker from '@/components/persion-date-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import type { BOM } from '@/types';
import type { ItemUnit, Product } from '@/types/item';

interface Props {
  boms: BOM[];
}

type ProductionOutput = {
  product_id: number | undefined;
  item_unit_id: number;
  quantity_produced: number;
}

type ProductionOutputPayload = {
  product_id: number | undefined;
  quantity_produced: number;
}

type ProductionOrder = {
  ordered_by: string;
  bom_id: number;
  order_date: string;
  notes?: string;
  productionOutputs: ProductionOutputPayload[];
}


const Create = ({ boms }: Props) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [productionOutput, setProductionOutput] = useState<ProductionOutput[]>([]);
  const [currentLine, setCurrentLine] = useState<ProductionOutput>({
    product_id: undefined,
    item_unit_id: 0,
    quantity_produced: 1,
  });
  const [lineError, setLineError] = useState<string | null>(null);
  const getUnits = (product?: Product): ItemUnit[] =>
    product?.item.units?.filter((unit) => unit.is_active) ??
    (product?.item.base_unit?.is_active ? [product.item.base_unit] : []);

  const { data, setData, errors, post, processing } = useForm<ProductionOrder>({
    'ordered_by': '',
    'bom_id': boms[0].id,
    'order_date': formatGregorianDate(new Date()),
    'notes': '',
    'productionOutputs': [],
  });
  useEffect(() => {
    setData('productionOutputs', productionOutput.map((output) => {
      const product = relatedProducts.find((candidate) => candidate.item_id === output.product_id);
      const unit = getUnits(product).find((candidate) => candidate.id === output.item_unit_id);

      return {
        product_id: output.product_id,
        quantity_produced: Number((output.quantity_produced * Number(unit?.conversion_to_base ?? 1)).toFixed(3)),
      };
    }));
  }, [productionOutput, relatedProducts, setData]);

  useEffect(() => {
    async function getRelatedProducts() {
      const selectedBom = boms.find((bom) => bom.id === data.bom_id);

      if (!selectedBom) {
        setRelatedProducts([]);

        return;
      }

      const pds = await axios.get('/factory/production-orders/get-related-products/' + selectedBom.category.id);

      if (pds.status == 200) {
        const products = pds.data as Product[];
        setRelatedProducts(products);
        setCurrentLine((previous) => {
          if (previous.product_id && products.some((product) => product.item_id === previous.product_id)) {
            return previous;
          }

          const firstProduct = products[0];

          return {
            product_id: firstProduct?.item_id,
            item_unit_id: getUnits(firstProduct)[0]?.id ?? 0,
            quantity_produced: 1,
          };
        });
      } else {
        console.log('error fetching data' + pds.statusText);

      }
    }
    getRelatedProducts();
  }, [boms, data.bom_id]);

  const handleOrders = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    post('/factory/production-orders', {
      onFinish: () => {
        setProductionOutput([]);
        setCurrentLine({
          product_id: relatedProducts[0]?.item_id,
          item_unit_id: getUnits(relatedProducts[0])[0]?.id ?? 0,
          quantity_produced: 1,
        });
      },
    });
  };


  const handleAddLine = () => {
    const productId = currentLine.product_id ?? relatedProducts[0]?.item_id;
    const product = relatedProducts.find((candidate) => candidate.item_id === productId);
    const itemUnitId = currentLine.item_unit_id || getUnits(product)[0]?.id;

    if (!productId || !itemUnitId || currentLine.quantity_produced <= 0) {
      setLineError('جنس، واحد و مقدار معتبر را انتخاب کنید.');

      return;
    }

    // prevent adding the same item twice
    if (productionOutput.some((l) => l.product_id === productId)) {
      setLineError('مقدار از این جنس قبلا تعین شده است');

      return;
    }

    setProductionOutput((prev) => [...prev, { ...currentLine, product_id: productId, item_unit_id: itemUnitId }]);
    setCurrentLine((prev) => ({
      ...prev,
      quantity_produced: 1,
    }));
    setLineError(null);
  };

  const handleRemoveLine = (index: number) => {
    setProductionOutput((prev) => prev.filter((_, i) => i !== index));
  };
  const selectedProduct = relatedProducts.find((product) => product.item_id === currentLine.product_id);
  const selectedUnit = getUnits(selectedProduct).find((unit) => unit.id === currentLine.item_unit_id);
  const itemUnit = selectedUnit?.symbol ?? selectedUnit?.name ?? selectedProduct?.item.unit ?? 'unit';

  const selectedBom = boms.find((bom) => bom.id === data.bom_id);

  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
      { title: 'لیست سفارشات', href: '/factory/production-orders' },
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


            <form onSubmit={handleOrders} name="orders" id="orders" className="space-y-6" dir='rtl'>
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="size-5" /></div><div><h2 className="font-semibold">اطلاعات اصلی سفارش</h2><p className="text-xs text-muted-foreground">مسؤول، فورمول و زمان اجرای سفارش</p></div></div>
                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ordered_by">سفارش کننده <span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="bom_id" >فورمول تولید <span className="text-destructive">*</span></Label>
                    <select
                      className="border p-1.5 rounded-md"
                      tabIndex={2}
                      name="bom_id"
                      value={data.bom_id}
                      disabled={productionOutput.length > 0}
                      onChange={(e) => setData('bom_id', Number(e.target.value))}


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
                              <PersionDatePicker
                                id="order_date"
                                label="تاریخ سفارش"
                                value={parseGregorianDate(data.order_date) ?? null}
                                onChange={(date) =>
                                  setData(
                                    'order_date',
                                    date ? formatGregorianDate(date) : '',
                                  )
                                }
                              />
                              <InputError message={errors.order_date} />
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
                      <Label htmlFor="product_id">جنس</Label>
                      <select
                        className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        name="product_id"
                        tabIndex={5}
                        value={currentLine.product_id ?? ''}
                        onChange={(e) => {
                          const productId = Number(e.target.value);
                          const product = relatedProducts.find(
                            (candidate) => candidate.item_id === productId,
                          );
                          setCurrentLine((prev) => ({
                            ...prev,
                            product_id: productId,
                            item_unit_id: getUnits(product)[0]?.id ?? 0,
                          }));
                        }}
                      >
                        {!relatedProducts.length && (
                          <option value="">محصولی برای این فورمول موجود نیست</option>
                        )}
                        {relatedProducts.map((product) => (
                          <option value={product.item_id} key={product.item_id}>
                            {product.item.name} — {product.item.code}
                          </option>
                        ))}
                      </select>
                      <InputError message={errors.productionOutputs} className="mt-2" />

                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="item_unit_id">واحد تولید</Label>
                      <select
                        id="item_unit_id"
                        className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={currentLine.item_unit_id}
                        onChange={(e) =>
                          setCurrentLine((prev) => ({
                            ...prev,
                            item_unit_id: Number(e.target.value),
                          }))
                        }
                        disabled={!getUnits(selectedProduct).length}
                      >
                        {!getUnits(selectedProduct).length && (
                          <option value={0}>واحد فعالی موجود نیست</option>
                        )}
                        {getUnits(selectedProduct).map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {getDariItemUnit(unit.name)}
                            {unit.symbol ? ` (${unit.symbol})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="quantity" className="flex justify-between">
                        <span>  مقدار  </span>
                        <span className="text-sm text-muted-foreground">
                          {getDariItemUnit(itemUnit)}
                        </span>
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={0.001}
                        step="0.001"
                        dir='ltr'
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
                <div dir='rtl' className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">خلاصه تولید</h3><span className="text-sm text-muted-foreground">{productionOutput.length} قلم</span></div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-center'>شماره</TableHead>
                        <TableHead className='text-center'>محصول</TableHead>
                        <TableHead className='text-center'>مقدار</TableHead>
                        <TableHead className='text-center'>واحد</TableHead>
                        <TableHead className='text-center'>حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionOutput.length > 0 && (
                        productionOutput.map((output, ind) =>
                          <TableRow key={ind}>
                            <TableCell className='text-center'>{ind + 1}</TableCell>
                            <TableCell className='text-center'>{relatedProducts.find(item => item.item_id === output.product_id)?.item.name}</TableCell>
                            <TableCell className='text-center'>{output.quantity_produced}</TableCell>
                            <TableCell className='text-center'>
                              {getDariItemUnit(
                                getUnits(relatedProducts.find((item) => item.item_id === output.product_id))
                                  .find((unit) => unit.id === output.item_unit_id)?.symbol ??
                                getUnits(relatedProducts.find((item) => item.item_id === output.product_id))
                                  .find((unit) => unit.id === output.item_unit_id)?.name ??
                                'unit',
                              )}
                            </TableCell>
                            <TableCell className='flex justify-center items-center'>
                              <button type="button" aria-label="حذف جنس" onClick={() => handleRemoveLine(ind)}><Trash2 className='size-4 text-destructive' /></button>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                  {/* <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 text-sm sm:flex-row sm:justify-between"><span>{totalQuantity} جمله مقدار</span><strong>{totalValue.toLocaleString()} جمله قیمت</strong></div> */}
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
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import LocationTranslator, { getDariCategory, getDariItemUnit } from '@/components/location-translator';
import {  Product } from '@/types/item';
import { BOM, ProductionInput } from '@/types';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { SectionTitle } from '@/components/section-title';

interface Props {
  boms: BOM[];
  products: Product[];
}

type ProductionOutput = {
  product_id: number;
  quantity_produced: number;
}

type ProductionOrder = {
  ordered_by: string;
  bom_id: number;
  notes?: string;
  productionOutputs: ProductionOutput[];
}


const Create = ({ boms, products }: Props) => {

  const [productionOutput, setProductionOutput] = useState<ProductionOutput[]>([]);
  const [lineError, setLineError] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<ProductionOutput>(() => ({
    product_id: products[0]?.item_id,
    quantity_produced: 1,
  }));

  const { data, setData, errors, post, processing } = useForm<ProductionOrder>({
    'ordered_by': '',
    'bom_id': boms[0].id,
    'notes': '',
    'productionOutputs': [],
  });
  useEffect(() => {
    setData('productionOutputs', productionOutput);
  }, [productionOutput, setData]);


  const handleOrders = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    post('/factory/production-orders', {
      onFinish: () => {
        setProductionOutput([]);
        setCurrentLine({
          product_id: products[0]?.id,
          quantity_produced: 1,
        });
      },
    });
  };


  const handleAddLine = () => {

    if (!currentLine.product_id || currentLine.quantity_produced <= 0) {
      return;
    }

    // prevent adding the same item twice
    if (productionOutput.some((l) => l.product_id === currentLine.product_id)) {
      setLineError('مقدار از این جنس قبلا تعین شده است');
      return;
    }

    setProductionOutput((prev) => [...prev, currentLine]);
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
    if (products.length === 0)
      return 'unit';
    return products.filter(product => product.item_id === currentLine.product_id)[0].item.unit;
    
  }, [currentLine]);

  
  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
      { title: 'لیست حواله جات', href: '/factory/production-orders' },
      { title: 'حواله جدید', href: '/factory/production-orders/create' },
    ]}>
     <div className="section">
        <section>
          <div className="max-w-3xl mx-auto p-5">
            <SectionTitle title='فورم حواله' />
            <div className="section">
              <form onSubmit={handleOrders} name="orders" id="orders">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                  <div className="grid gap-2">
                    <Label htmlFor="ordered_by">حواله از طرف</Label>
                    <Input
                      className="border p-1.5 rounded-md text-sm"
                      tabIndex={2}
                      name="ordered_by"
                      value={data.ordered_by}
                      onChange={(e) =>
                        setData('ordered_by', e.target.value)
                      }
                      placeholder="حواله توسط که شده؟"
                    />
                    <InputError message={errors.ordered_by} className="mt-2" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bom_id">فورمول</Label>
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
                  </div>

                
                <div className="grid gap-2 mt-5">
                  <Label htmlFor="notes">نوت</Label>
                  <textarea
                    className="border p-1.5 rounded-md text-sm"
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

                <section className="section ITEMSection mt-8">
                  <div>
                    <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                      <div className="grid gap-2">
                        <Label htmlFor="product_id">جنس که حواله میشه</Label>
                        <select
                          className="border p-1.5 rounded-md dark:bg-secondary-foreground dark:text-accent"
                          name="product_id"
                          tabIndex={5}
                          value={currentLine.product_id}
                          onChange={(e) =>
                            setCurrentLine((prev) => ({
                              ...prev,
                              product_id: Number(e.target.value),
                            }))
                          }
                        >
                          {products.map((product) => (
                            <option value={product.item_id} key={product.item_id} className='dark:bg-secondary dark:text-accent'>
                              {product.item.name} {(product.weight/product.per_pack).toFixed(3)}
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
                          className="border p-1.5 rounded-md"
                        />
                        <InputError message={errors.productionOutputs} className="mt-2" />

                      </div>


                    </div>

                    <div className="mt-4">
                      <Button
                        type="button"
                        className="w-full"
                        variant={'secondary'}
                        tabIndex={6}
                        onClick={handleAddLine}
                      >
                        اضافه کردن جنس
                      </Button>
                    </div>
                    {lineError && <div className="mt-2"><InputError message={lineError} /></div>}
                  </div>
                </section>



                {/* ================================  RESULTS  =============================================== */}
                {productionOutput.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-lg border">
                    <div className="bg-slate-50 px-4 py-3 text-sm font-medium">
                     اجناس
                    </div>
                    <div className="divide-y">
                      {productionOutput.map((line, index) => (
                        <div
                          key={`${line.product_id}-${index}`}
                          className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                              <div className=" p-5 border rounded-sm bg-white">جنس: {products.find((product) => product.item_id === line.product_id)?.item.name || line.product_id}</div>

                              <div className=" p-5 border rounded-sm bg-white">مقدار: {line.quantity_produced}</div>

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

                <div className="mt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    tabIndex={7}
                    data-test="register-employee-button"
                  >
                    {processing && <Spinner />}
                    ثبت کنید
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default Create
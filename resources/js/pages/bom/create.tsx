import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import { getDariCategory, getDariItemUnit } from '@/components/location-translator';
import { Category, Item } from '@/types/item';

interface Props {
  categories: Category[];
  items: Item[];
}

type BOMLine = {
  item_id: number;
  required_quantity: number;
}

type BOMType = {
  formula_name: string;
  category_id: number;
  min_exp_qty: number;
  max_exp_qty: number;
  bomLines: BOMLine[];
}

const Create = ({ categories, items }: Props) => {
  const [BOMLine, setBOMLine] = useState<BOMLine[]>([]);
  const [lineError, setLineError] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<BOMLine>(() => ({
    item_id: items[0]?.id ?? 0,
    required_quantity: 1,
  }));

  const { data, setData, errors, post, processing } = useForm<BOMType>({
    'formula_name': '',
    'category_id': categories[0].id,
    'min_exp_qty': 1,
    'max_exp_qty': 1,
    'bomLines': [],
  });

  useEffect(() => {
    setData('bomLines', BOMLine);
  }, [BOMLine, setData]);

  const handleBOM = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/boms', {
      onFinish: () => {
        setBOMLine([]);
        setCurrentLine({
          item_id: items[0]?.id ?? 1,
          required_quantity: 1,
        });
      },
    });
  };

  const handleAddLine = () => {

    if (!currentLine.item_id || currentLine.required_quantity <= 0) {
      return;
    }

    // prevent adding the same item twice
    if (BOMLine.some((l) => l.item_id === currentLine.item_id)) {
      setLineError('این جنس قبلا اضافه شده است');
      return;
    }

    setBOMLine((prev) => [...prev, currentLine]);
    setCurrentLine((prev) => ({
      ...prev,
      required_quantity: 1,
    }));
    setLineError(null);
  };

  const handleRemoveLine = (index: number) => {
    setBOMLine((prev) => prev.filter((_, i) => i !== index));
  };

  const itemUnit = useMemo(() => {
    if (items.length === 0)
      return 'unit';
    return items.filter(item => item.id === currentLine.item_id)[0].unit;

  }, [currentLine]);
  return (
    <AppLayout
      breadcrumbs={[
        { title: 'دشبورد', href: '/dashbaord' },
        { title: 'فورموله ها', href: '/boms' },
        { title: 'فورم', href: '/boms/create' },
      ]}
    >
      <div className="section">
        <section>
          <div className="max-w-3xl mx-auto p-5">
            <SectionTitle title='فورم فورموله' />
            <div className="section">
              <form onSubmit={handleBOM} name="boms" id="boms">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                  <div className="grid gap-2">
                    <Label htmlFor="formula_name">نام فورمول</Label>
                    <Input
                      className="border p-1.5 rounded-md text-sm"
                      tabIndex={2}
                      name="formula_name"
                      value={data.formula_name}
                      onChange={(e) =>
                        setData('formula_name', e.target.value)
                      }
                      placeholder="نام فورمول را داخل کنین"
                    />
                    <InputError message={errors.formula_name} className="mt-2" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category_id">جنس</Label>
                    <select
                      className="border p-1.5 rounded-md"
                      tabIndex={2}
                      name="category_id"
                      value={data.category_id}
                      onChange={(e) =>
                        setData('category_id', Number(e.target.value))
                      }
                    >
                      <option value={0}>جنس که برای فورمول ساخته میشود</option>
                      {categories.map((category) => (
                        <option value={category.id} key={category.id} >
                          {getDariCategory(category.name)}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.category_id} className="mt-2" />
                  </div>

                <div className="grid gap-2 mt-5">
                  <Label htmlFor="min_exp_qty">مقدار تخمینی حداقل</Label>
                  <Input
                    className="border p-1.5 rounded-md text-sm"
                    tabIndex={2}
                    name="min_exp_qty"
                    value={data.min_exp_qty}
                    onChange={(e) =>
                      setData('min_exp_qty', Number(e.target.value))
                    }
                    placeholder="مقدار جنس تخمینی را وارد کنید که حداقل باید تولید شود"
                  />

                  <InputError message={errors.min_exp_qty} className="mt-2" />
                </div>
                <div className="grid gap-2 mt-5">
                  <Label htmlFor="max_exp_qty">مقدار تخمینی حداکثر</Label>
                  <Input
                    className="border p-1.5 rounded-md text-sm"
                    tabIndex={2}
                    min={data.min_exp_qty}
                    name="max_exp_qty"
                    value={data.max_exp_qty}
                    onChange={(e) =>
                      setData('max_exp_qty', Number(e.target.value))
                    }
                    placeholder="مقدار جنس تخمینی را وارد کنید که حداکثر باید تولید شود"
                  />

                  <InputError message={errors.max_exp_qty} className="mt-2" />
                </div>
                </div>

                <section className="section ITEMSection mt-8">
                  <div>
                    <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                      <div className="grid gap-2">
                        <Label htmlFor="item_id">مواد خام یا پیکنګ</Label>
                        <select
                          className="border p-1.5 rounded-md"
                          name="item_id"
                          tabIndex={5}
                          value={currentLine.item_id}
                          onChange={(e) =>
                            setCurrentLine((prev) => ({
                              ...prev,
                              item_id: Number(e.target.value),
                            }))
                          }
                        >
                          {items.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <InputError message={errors.bomLines} className="mt-2" />

                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="quantity" className="flex justify-between">
                          <span>  مقدار  </span>
                          <span className="text-sm text-muted-foreground">
                            {currentLine.required_quantity} {getDariItemUnit(itemUnit)}
                          </span>
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={1}
                          // max={items[currentLine.item_id]}
                          value={currentLine.required_quantity}
                          onChange={(e) =>
                            setCurrentLine((prev) => ({
                              ...prev,
                              required_quantity: Number(e.target.value),
                            }))
                          }
                          placeholder="مقدار"
                          className="border p-1.5 rounded-md"
                        />
                        <InputError message={errors.bomLines} className="mt-2" />

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
                {BOMLine.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-lg border">
                    <div className="bg-slate-50 px-4 py-3 text-sm font-medium">
                      خطوط حواله
                    </div>
                    <div className="divide-y">
                      {BOMLine.map((line, index) => (
                        <div
                          key={`${line.item_id}-${index}`}
                          className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                              <div className=" p-5 border rounded-sm bg-white">جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>

                              <div className=" p-5 border rounded-sm bg-white">مقدار: {line.required_quantity}</div>

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
  );
};

export default Create;